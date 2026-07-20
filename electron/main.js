const { app, BrowserWindow, ipcMain, systemPreferences, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const https = require('https')
const http = require('http')
const fs = require('fs')
const { Pool } = require('pg')
const nodemailer = require('nodemailer')
const Store = require('electron-store')
const bcrypt = require('bcryptjs')

// Umgebungsvariablen laden: .env (Dev) oder config.json (gebündelte App)
try { require('dotenv').config({ path: path.join(__dirname, '../.env') }) } catch {}
try {
  const configPath = app.isPackaged
    ? path.join(process.resourcesPath, 'config.json')
    : path.join(__dirname, '../config.json')
  const cfg = JSON.parse(require('fs').readFileSync(configPath, 'utf8'))
  for (const [k, v] of Object.entries(cfg)) {
    if (!process.env[k]) process.env[k] = v
  }
} catch {}

const DOC_PREFIXES = { angebot: 'ZB', rechnung: 'RG', lieferschein: 'LS', gutschrift: 'GS' }

const store = new Store({ name: 'aku-settings' })

// DB-Konfiguration: erst .env, dann electron-store
const getDbConfig = () => {
  const saved = store.get('dbConfig') || {}
  return {
    host: process.env.DB_HOST || saved.host || '',
    port: parseInt(process.env.DB_PORT || saved.port || '5432'),
    user: process.env.DB_USER || saved.user || 'postgres',
    password: process.env.DB_PASSWORD || saved.password || '',
    database: process.env.DB_NAME || saved.database || 'postgres',
  }
}

let pool = null

const createPool = () => {
  const cfg = getDbConfig()
  if (!cfg.host || !cfg.password) return null
  return new Pool({ ...cfg, ssl: false, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000 })
}

pool = createPool()

ipcMain.handle('db:configure', async (_, config) => {
  store.set('dbConfig', config)
  if (pool) { try { await pool.end() } catch {} }
  pool = createPool()
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('db:getConfig', async () => {
  return store.get('dbConfig') || {}
})

ipcMain.handle('db:isConfigured', async () => {
  if (!pool) return false
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    return true
  } catch {
    return false
  }
})


ipcMain.handle('db:init', async () => {
  if (!pool) return { error: 'Nicht konfiguriert' }
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
    // Offers / Angebote
    await pool.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        doc_type VARCHAR(30) DEFAULT 'angebot',
        offer_number VARCHAR(50),
        title VARCHAR(255) NOT NULL,
        items JSONB DEFAULT '[]',
        notes TEXT,
        tax_rate DECIMAL(5,2) DEFAULT 19,
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'entwurf',
        valid_until DATE,
        due_date DATE,
        service_location TEXT DEFAULT '',
        processor VARCHAR(255) DEFAULT '',
        intro_text TEXT DEFAULT '',
        template VARCHAR(30) DEFAULT 'zeitblick',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    return { success: true }
  } catch (err) {
    console.error('DB init error:', err)
    return { success: false, error: err.message }
  }
})

// Offers / Angebote
ipcMain.handle('offers:list', async (event, userId) => {
  try {
    const res = await pool.query(
      `SELECT * FROM offers WHERE user_id=$1 ORDER BY created_at DESC`,
      [userId]
    )
    return { success: true, offers: res.rows }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('offers:save', async (event, { id, userId, contactId, docType, offerNumber, title, items, notes, taxRate, subtotal, taxAmount, total, status, validUntil, dueDate, serviceLocation, processor, introText, template }) => {
  try {
    const type = docType || 'angebot'
    if (id) {
      await pool.query(`
        UPDATE offers SET contact_id=$1, offer_number=$2, title=$3, items=$4, notes=$5, tax_rate=$6,
          subtotal=$7, tax_amount=$8, total=$9, status=$10, valid_until=$11, doc_type=$12, due_date=$13,
          service_location=$14, processor=$15, intro_text=$16, template=$17, updated_at=NOW()
        WHERE id=$18 AND user_id=$19
      `, [contactId||null, offerNumber||'', title, JSON.stringify(items||[]), notes||'', taxRate||19,
          subtotal||0, taxAmount||0, total||0, status||'entwurf', validUntil||null, type, dueDate||null,
          serviceLocation||'', processor||'', introText||'', template||'zeitblick', id, userId])
      return { success: true, id }
    } else {
      const year = new Date().getFullYear()
      const prefix = DOC_PREFIXES[type] || 'ZB'
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM offers WHERE user_id=$1 AND doc_type=$2 AND EXTRACT(YEAR FROM created_at)=$3`,
        [userId, type, year]
      )
      const num = String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0')
      const autoNumber = offerNumber || `${prefix}-${year}-${num}`
      const res = await pool.query(`
        INSERT INTO offers (user_id, contact_id, doc_type, offer_number, title, items, notes, tax_rate, subtotal, tax_amount, total, status, valid_until, due_date, service_location, processor, intro_text, template)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id
      `, [userId, contactId||null, type, autoNumber, title, JSON.stringify(items||[]), notes||'', taxRate||19,
          subtotal||0, taxAmount||0, total||0, status||'entwurf', validUntil||null, dueDate||null,
          serviceLocation||'', processor||'', introText||'', template||'zeitblick'])
      return { success: true, id: res.rows[0].id, offerNumber: autoNumber }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('offers:delete', async (event, offerId, userId) => {
  try {
    await pool.query('DELETE FROM offers WHERE id=$1 AND user_id=$2', [offerId, userId])
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('offers:exportPdf', async (event, { html, filename }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog({
      defaultPath: filename || 'angebot.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (canceled || !filePath) return { success: false, error: 'Abgebrochen' }
    const win = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true } })
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    await new Promise(resolve => setTimeout(resolve, 600))
    const pdfData = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    })
    win.close()
    fs.writeFileSync(filePath, pdfData)
    const { shell } = require('electron')
    shell.openPath(filePath)
    return { success: true, filePath }
  } catch (err) {
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

ipcMain.handle('fetch:overpass', async (_, query) => {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(query)
    const req = https.request({
      hostname: 'overpass-api.de',
      path: '/api/interpreter',
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Content-Length': body.length, 'User-Agent': 'AkuCRM/1.0' },
      timeout: 30000,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        const ct = res.headers['content-type'] || ''
        if (!ct.includes('json') && data.trim().startsWith('<')) {
          reject(new Error('Overpass API nicht erreichbar. Bitte später erneut versuchen.'))
          return
        }
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error('Ungültige Antwort vom Server.')) }
      })
    })
    req.on('error', (e) => reject(new Error('Netzwerkfehler: ' + e.message)))
    req.on('timeout', () => { req.destroy(); reject(new Error('Zeitüberschreitung. Bitte erneut versuchen.')) })
    req.write(body)
    req.end()
  })
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

  if (app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()

    autoUpdater.on('update-available', () => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) win.webContents.send('update:available')
    })

    autoUpdater.on('update-downloaded', () => {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) win.webContents.send('update:ready')
    })
  }
})

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
