const { Pool } = require('pg')

let pool

function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || '46.224.59.145',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'postgres',
      ssl: false,
    })
  }
  return pool
}

async function initDb() {
  const p = getPool()
  // Same migrations as electron/main.js db:init
  await p.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='users' AND table_schema='public') THEN
        DROP SEQUENCE IF EXISTS users_id_seq;
      END IF;
    END $$
  `)
  await p.query(`
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
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`)
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT ''`)
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE DEFAULT NULL`)
  await p.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS web_settings JSONB DEFAULT '{}'`)

  const bcrypt = require('bcryptjs')
  const adminHash = await bcrypt.hash('aku-admin-2024', 10)
  await p.query(
    `INSERT INTO users (name, email, password_hash, is_admin) VALUES ('Admin', 'admin@aku.app', $1, true) ON CONFLICT (email) DO NOTHING`,
    [adminHash]
  )
  await p.query(`UPDATE users SET is_admin=true WHERE email='admin@aku.app'`)

  await p.query(`
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
  await p.query(`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS call_history (
      id SERIAL PRIMARY KEY,
      contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
      call_date TIMESTAMP DEFAULT NOW(),
      result VARCHAR(255),
      notes TEXT
    )
  `)

  await p.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='email_campaigns' AND table_schema='public') THEN
        DROP SEQUENCE IF EXISTS email_campaigns_id_seq;
      END IF;
    END $$
  `)
  await p.query(`
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

  await p.query(`
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
      company_name VARCHAR(255),
      company_address TEXT,
      contact_person VARCHAR(255),
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

  // Offers column migrations (for tables created before these columns existed)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255)`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS company_address TEXT`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255)`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS service_location TEXT DEFAULT ''`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS processor VARCHAR(255) DEFAULT ''`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS intro_text TEXT DEFAULT ''`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS template VARCHAR(30) DEFAULT 'zeitblick'`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS doc_type VARCHAR(30) DEFAULT 'angebot'`)
  await p.query(`ALTER TABLE offers ADD COLUMN IF NOT EXISTS due_date DATE`)

  await p.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `)

  // Industry migration
  await p.query(`
    UPDATE contacts SET industry = CASE
      WHEN company_name ~* '(krankenhaus|klinikum|hospital)' AND industry IS NULL THEN 'hospital'
      WHEN company_name ~* '(reha|rehabilitation)' AND industry IS NULL THEN 'rehabilitation'
      WHEN company_name ~* '(ambulant|häusliche.*(pflege|krankenpflege)|mobil.*(pflege|dienst)|pflegedienst|sozialstation)' AND industry IS NULL THEN 'ambulatory_care'
      WHEN company_name ~* '(betreutes wohnen|seniorenresidenz|wohnstift|seniorenwohnanlage)' AND industry IS NULL THEN 'assisted_living'
      WHEN company_name ~* '(pflegeheim|altenheim|altenpflege|seniorenheim|seniorenpflege|altenzentrum|seniorenzentrum|pflegezentrum|pflege.*heim|heim.*pflege)' AND industry IS NULL THEN 'nursing_home'
      WHEN company_name ~* '(klinik|medizin)' AND industry IS NULL THEN 'hospital'
      ELSE industry
    END
    WHERE industry IS NULL
  `)

  console.log('DB initialized')
}

module.exports = { getPool, initDb }
