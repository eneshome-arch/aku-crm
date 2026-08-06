const express = require('express')
const bcrypt = require('bcryptjs')
const { getPool } = require('../db')
const { signToken, requireAuth } = require('../auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const pool = getPool()
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (!result.rows.length) return res.json({ success: false, error: 'Benutzer nicht gefunden' })
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.json({ success: false, error: 'Falsches Passwort' })
    const token = signToken(user)
    res.cookie('aku_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    const { password_hash, ...safeUser } = user
    res.json({ success: true, user: safeUser, token })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, city, lat, lon, address, birthdate } = req.body
    const pool = getPool()
    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, city, lat, lon, address, birthdate)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email, hash, city || '', lat || 52.3759, lon || 9.7320, address || '', birthdate || null]
    )
    const user = result.rows[0]
    const token = signToken(user)
    res.cookie('aku_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    const { password_hash, ...safeUser } = user
    res.json({ success: true, user: safeUser, token })
  } catch (err) {
    if (err.code === '23505') return res.json({ success: false, error: 'E-Mail bereits registriert' })
    res.json({ success: false, error: err.message })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.userId])
    if (!result.rows.length) return res.json({ success: false, error: 'Benutzer nicht gefunden' })
    const { password_hash, ...safeUser } = result.rows[0]
    res.json({ success: true, user: safeUser })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.get('/user/:id', requireAuth, async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id])
    if (!result.rows.length) return res.json({ success: false, error: 'Benutzer nicht gefunden' })
    const { password_hash, ...safeUser } = result.rows[0]
    res.json({ success: true, user: safeUser })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, city, lat, lon, email_config, address, birthdate } = req.body
    const pool = getPool()
    const result = await pool.query(
      `UPDATE users SET name=$1, city=$2, lat=$3, lon=$4, email_config=$5, address=$6, birthdate=$7
       WHERE id=$8 RETURNING *`,
      [name, city, lat, lon, email_config ? JSON.stringify(email_config) : null, address, birthdate || null, req.user.userId]
    )
    const { password_hash, ...safeUser } = result.rows[0]
    res.json({ success: true, user: safeUser })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('aku_token')
  res.json({ success: true })
})

module.exports = router
