const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron')
const path = require('path')
const https = require('https')
const http = require('http')
const { Pool } = require('pg')
const nodemailer = require('nodemailer')
const Store = require('electron-store')
const bcrypt = require('bcryptjs')

const store = new Store({ name: 'aku-settings' })

const pool = new Pool({
  host: '46.224.59.145',
  port: 5432,
  user: 'postgres',
  password: 'IhMfRhzWsgDVCJG5gLd2B5ZO4y30icXGf6mE4qErUlyEplK6aKV983XttVlby69v',
  database: 'postgres',
  ssl: false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
})


ipcMain.handle('db:init', async () => {
  try {
    // Clean up orphaned sequence only if users table doesn't exist yet
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users' AND table_schema='public') THEN
          DROP SEQUENCE IF EXISTS users_id_seq;
        END IF;
      END $$
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        city VARCHAR(100) DEFAULT '',
        lat DOUBLE PRECISION DEFAULT 52.3759,
        lon DOUBLE PRECISION DEFAULT 9.7320,
        email_config JSONB DEFAULT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT ''`)
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE DEFAULT NULL`)
    // Admin-Account beim ersten Start anlegen (idempotent)
    const adminHash = await bcrypt.hash('aku-admin-2024', 10)
    await pool.query(
      `INSERT INTO users (name, email, password_hash, is_admin) VALUES ('Admin', 'admin@aku.app', $1, true) ON CONFLICT (email) DO NOTHING`,
      [adminHash]
    )
    // Sicherstellen dass bestehender Admin-Account is_admin=true hat
    await pool.query(`UPDATE users SET is_admin=true WHERE email='admin@aku.app'`)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        industry VARCHAR(255),
        company_size VARCHAR(100),
        address VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        website VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        position VARCHAR(100),
        phone_central VARCHAR(50),
        phone_direct VARCHAR(50),
        mobile VARCHAR(50),
        email VARCHAR(255),
        status INTEGER DEFAULT 1,
        next_followup TIMESTAMP,
        followup_note TEXT,
        revenue_potential DECIMAL(10,2),
        contract_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_history (
        id SERIAL PRIMARY KEY,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        call_date TIMESTAMP DEFAULT NOW(),
        result VARCHAR(255),
        notes TEXT
      )
    `)
    // user_id Spalte nachrüsten falls contacts-Tabelle schon existierte
    await pool.query(`
      ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
    `)
    await pool.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_campaigns' AND table_schema='public') THEN
          DROP SEQUENCE IF EXISTS email_campaigns_id_seq;
        END IF;
      END $$
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        subject TEXT,
        body_html TEXT,
        body_json JSONB,
        recipient_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        fail_count INTEGER DEFAULT 0,
        recipients JSONB,
        results JSONB,
        sent_at TIMESTAMP DEFAULT NOW()
      )
    `)
    return { success: true }
  } catch (err) {
    console.error('DB init error:', err)
    return { success: false, error: err.message }
  }
})

// Auth
ipcMain.handle('auth:register', async (event, { name, email, password, city, lat, lon, address, birthdate }) => {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.rows.length > 0) return { success: false, error: 'E-Mail bereits registriert.' }
    const hash = await bcrypt.hash(password, 10)
    const res = await pool.query(
      'INSERT INTO users (name, email, password_hash, city, lat, lon, address, birthdate) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, email, city, lat, lon, address, birthdate, is_admin',
      [name, email, hash, city || '', lat || 52.3759, lon || 9.7320, address || '', birthdate || null]
    )
    return { success: true, user: res.rows[0] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('auth:login', async (event, { email, password }) => {
  try {
    const res = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (res.rows.length === 0) return { success: false, error: 'E-Mail oder Passwort falsch.' }
    const user = res.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return { success: false, error: 'E-Mail oder Passwort falsch.' }
    const { password_hash, ...safeUser } = user
    return { success: true, user: safeUser }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Touch ID
ipcMain.handle('auth:touchId', async (event, reason) => {
  try {
    await systemPreferences.promptTouchID(reason || 'Bei Aku CRM anmelden')
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// User per ID laden (nach Touch ID)
ipcMain.handle('auth:getUserById', async (event, userId) => {
  try {
    const res = await pool.query(
      'SELECT id, name, email, city, lat, lon, email_config, is_admin, address, birthdate FROM users WHERE id=$1',
      [userId]
    )
    if (res.rows.length === 0) return { success: false, error: 'Session abgelaufen.' }
    return { success: true, user: res.rows[0] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Admin: User-Details (Kontakte + Statistiken)
ipcMain.handle('admin:getUserDetail', async (event, userId) => {
  try {
    const user = await pool.query(
      'SELECT id, name, email, city, lat, lon, is_admin, email_config, address, birthdate, created_at FROM users WHERE id=$1',
      [userId]
    )
    const contacts = await pool.query(
      `SELECT c.id, c.company_name, c.industry, c.city, c.status, c.next_followup,
              c.revenue_potential, c.created_at,
              (SELECT COUNT(*) FROM call_history WHERE contact_id = c.id) as call_count
       FROM contacts c WHERE c.user_id = $1 ORDER BY c.created_at DESC`,
      [userId]
    )
    const stats = await pool.query(
      `SELECT
        COUNT(*) as total_contacts,
        SUM(revenue_potential) as total_revenue,
        COUNT(CASE WHEN status = 9 THEN 1 END) as active_customers,
        COUNT(CASE WHEN next_followup < NOW() AND next_followup IS NOT NULL THEN 1 END) as overdue,
        (SELECT COUNT(*) FROM call_history ch JOIN contacts c2 ON ch.contact_id=c2.id WHERE c2.user_id=$1) as total_calls
       FROM contacts WHERE user_id=$1`,
      [userId]
    )
    return { success: true, user: user.rows[0], contacts: contacts.rows, stats: stats.rows[0] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Admin: Alle User abrufen
ipcMain.handle('admin:getUsers', async () => {
  try {
    const res = await pool.query(`
      SELECT u.id, u.name, u.email, u.city, u.address, u.birthdate, u.is_admin, u.created_at,
        (SELECT COUNT(*) FROM contacts c WHERE c.user_id = u.id) as contact_count
      FROM users u ORDER BY u.created_at DESC
    `)
    return { success: true, users: res.rows }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Admin: User löschen
ipcMain.handle('admin:deleteUser', async (event, userId) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1 AND is_admin=false', [userId])
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Admin: Passwort eines Users zurücksetzen
ipcMain.handle('admin:resetPassword', async (event, userId, newPassword) => {
  try {
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2 AND is_admin=false', [hash, userId])
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('auth:updateProfile', async (event, userId, { name, city, lat, lon, email_config, address, birthdate }) => {
  try {
    await pool.query(
      'UPDATE users SET name=$1, city=$2, lat=$3, lon=$4, email_config=$5, address=$6, birthdate=$7 WHERE id=$8',
      [name, city, lat, lon, email_config ? JSON.stringify(email_config) : null, address || '', birthdate || null, userId]
    )
    const res = await pool.query('SELECT id, name, email, city, lat, lon, email_config, is_admin, address, birthdate FROM users WHERE id=$1', [userId])
    return { success: true, user: res.rows[0] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject)
        return
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
  })
}

function extractMeta(html, prop) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${prop}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1].trim()
  }
  return null
}

function parseJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        const type = item['@type'] || ''
        if (/LocalBusiness|Organization|Corporation|Store|Restaurant|Hotel|Company/i.test(type)) {
          return item
        }
      }
    } catch {}
  }
  return null
}

function parseAddress(addrObj) {
  if (!addrObj) return {}
  if (typeof addrObj === 'string') return { address: addrObj }
  return {
    address: [addrObj.streetAddress].filter(Boolean).join(' '),
    city: addrObj.addressLocality || '',
    postal_code: addrObj.postalCode || '',
  }
}

function parseGoogleMaps(html, url) {
  const result = {}

  // Name aus Titel
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  if (titleMatch) {
    result.company_name = titleMatch[1].replace(' - Google Maps', '').replace(' – Google Maps', '').trim()
  }

  // Telefon
  const phoneMatch = html.match(/["']\+?[\d\s\-\(\)]{7,20}["']/)
  if (phoneMatch) result.phone_central = phoneMatch[0].replace(/["']/g, '').trim()

  // Website aus URL-Parametern oder HTML
  const websiteMatch = html.match(/["']https?:\/\/(?!(?:www\.)?google)[^"']+\.[a-z]{2,}[^"']*["']/)
  if (websiteMatch) result.website = websiteMatch[0].replace(/["']/g, '')

  return result
}

// Settings
ipcMain.handle('settings:get', () => store.store)
ipcMain.handle('settings:set', (event, key, value) => { store.set(key, value); return true })

// Email: Verbindung testen
ipcMain.handle('email:test', async (event, config) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.email, pass: config.password },
      tls: { rejectUnauthorized: false },
    })
    await transporter.verify()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Email: Senden
ipcMain.handle('email:send', async (event, config, recipients) => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.email, pass: config.password },
      tls: { rejectUnauthorized: false },
    })

    const results = []
    for (const r of recipients) {
      try {
        await transporter.sendMail({
          from: `${config.senderName || config.email} <${config.email}>`,
          to: r.to,
          subject: r.subject,
          html: r.html,
          text: r.text,
        })
        results.push({ email: r.to, success: true })
      } catch (err) {
        results.push({ email: r.to, success: false, error: err.message })
      }
    }
    return { success: true, results }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

// Kampagnen
ipcMain.handle('campaigns:save', async (event, { userId, name, subject, bodyHtml, bodyJson, recipients, results }) => {
  try {
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    const res = await pool.query(
      `INSERT INTO email_campaigns (user_id, name, subject, body_html, body_json, recipient_count, success_count, fail_count, recipients, results)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [userId, name, subject, bodyHtml, JSON.stringify(bodyJson || null), recipients.length, successCount, failCount, JSON.stringify(recipients), JSON.stringify(results)]
    )
    return { success: true, id: res.rows[0].id }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('campaigns:list', async (event, userId) => {
  try {
    const res = await pool.query(
      `SELECT id, name, subject, recipient_count, success_count, fail_count, sent_at
       FROM email_campaigns WHERE user_id=$1 ORDER BY sent_at DESC`,
      [userId]
    )
    return { success: true, campaigns: res.rows }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('campaigns:get', async (event, campaignId) => {
  try {
    const res = await pool.query('SELECT * FROM email_campaigns WHERE id=$1', [campaignId])
    return { success: true, campaign: res.rows[0] }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('campaigns:delete', async (event, campaignId) => {
  try {
    await pool.query('DELETE FROM email_campaigns WHERE id=$1', [campaignId])
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fetch:extract', async (event, url) => {
  try {
    const html = await fetchUrl(url)
    const isGoogleMaps = url.includes('google.com/maps') || url.includes('maps.google')

    let data = {}

    if (isGoogleMaps) {
      data = parseGoogleMaps(html, url)
    } else {
      // JSON-LD zuerst
      const jsonLd = parseJsonLd(html)
      if (jsonLd) {
        data.company_name = jsonLd.name || ''
        data.phone_central = jsonLd.telephone || ''
        data.email = jsonLd.email || ''
        data.website = jsonLd.url || url
        const addr = parseAddress(jsonLd.address)
        Object.assign(data, addr)
      }

      // Fallback: OG/Meta Tags
      if (!data.company_name) {
        data.company_name =
          extractMeta(html, 'og:site_name') ||
          extractMeta(html, 'og:title') ||
          html.match(/<title>([^<|–-]+)/i)?.[1]?.trim() || ''
      }
      if (!data.website) data.website = url
    }

    // Bereinigen
    Object.keys(data).forEach(k => {
      if (typeof data[k] === 'string') data[k] = data[k].replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
    })

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('db:query', async (event, sql, params) => {
  try {
    const result = await pool.query(sql, params)
    return { rows: result.rows }
  } catch (err) {
    console.error('DB query error:', err)
    return { error: err.message }
  }
})

// Window controls (für Windows Custom Titlebar)
ipcMain.handle('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
ipcMain.handle('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize()
})
ipcMain.handle('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})
ipcMain.handle('window:isMaximized', (event) => {
  return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false
})
ipcMain.handle('window:platform', () => process.platform)

function createWindow() {
  const isMac = process.platform === 'darwin'
  const isWindows = process.platform === 'win32'

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    frame: !isWindows,
    backgroundColor: '#f5f5f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setMenuBarVisibility(false)

  // Maximize-State-Änderungen ans Frontend melden
  win.on('maximize', () => win.webContents.send('window:maximized', true))
  win.on('unmaximize', () => win.webContents.send('window:maximized', false))

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
