const express = require('express')
const bcrypt = require('bcryptjs')
const { getPool } = require('../db')
const { requireAdmin } = require('../auth')

const router = express.Router()

router.use(requireAdmin)

router.get('/users', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.is_admin, u.created_at,
        (SELECT COUNT(*) FROM contacts WHERE user_id = u.id) as contact_count
      FROM users u ORDER BY u.created_at DESC
    `)
    res.json({ success: true, users: result.rows })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.get('/users/:id', async (req, res) => {
  try {
    const pool = getPool()
    const userRes = await pool.query('SELECT id, name, email, is_admin, city, created_at FROM users WHERE id=$1', [req.params.id])
    if (!userRes.rows.length) return res.json({ success: false, error: 'Nicht gefunden' })
    const contactsRes = await pool.query('SELECT * FROM contacts WHERE user_id=$1 ORDER BY company_name', [req.params.id])
    const callsRes = await pool.query(
      `SELECT COUNT(*) as total_calls FROM call_history ch
       JOIN contacts c ON ch.contact_id = c.id WHERE c.user_id=$1`,
      [req.params.id]
    )
    res.json({
      success: true,
      user: userRes.rows[0],
      contacts: contactsRes.rows,
      stats: { totalCalls: parseInt(callsRes.rows[0].total_calls) || 0 }
    })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.delete('/users/:id', async (req, res) => {
  try {
    const pool = getPool()
    const user = await pool.query('SELECT is_admin FROM users WHERE id=$1', [req.params.id])
    if (user.rows[0]?.is_admin) return res.json({ success: false, error: 'Admin kann nicht gelöscht werden' })
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/users/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body
    const pool = getPool()
    const hash = await bcrypt.hash(newPassword, 10)
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

module.exports = router
