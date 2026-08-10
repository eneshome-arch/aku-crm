require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { initDb } = require('./db')
const { requireAuth } = require('./auth')

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: [
    'https://app.zeitblick-personal.de',
    'http://localhost:5173',
    'http://localhost:5174',
  ],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(cookieParser())

// Rate limiting on auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Zu viele Anmeldeversuche. Bitte warten.' },
})

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/query', requireAuth, require('./routes/query'))
app.use('/api/offers', requireAuth, require('./routes/offers'))
app.use('/api/campaigns', requireAuth, require('./routes/campaigns'))
app.use('/api/email', requireAuth, require('./routes/email'))
app.use('/api/admin', requireAuth, require('./routes/admin'))
app.use('/api/settings', requireAuth, require('./routes/settings'))
app.use('/api/fetch', requireAuth, require('./routes/fetch'))
app.use('/api/notes', requireAuth, require('./routes/notes'))

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 3001

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
