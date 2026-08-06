const express = require('express')
const { getPool } = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT id, user_id, name, subject, recipient_count, success_count, fail_count, sent_at FROM email_campaigns WHERE user_id=$1 ORDER BY sent_at DESC',
      [req.query.userId]
    )
    res.json({ success: true, campaigns: result.rows })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM email_campaigns WHERE id=$1', [req.params.id])
    res.json({ success: true, campaign: result.rows[0] || null })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const d = req.body
    const pool = getPool()
    const result = await pool.query(
      `INSERT INTO email_campaigns (user_id, name, subject, body_html, body_json, recipient_count, success_count, fail_count, recipients, results)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [d.userId, d.name, d.subject, d.bodyHtml, d.bodyJson ? JSON.stringify(d.bodyJson) : null,
       d.recipientCount || 0, d.successCount || 0, d.failCount || 0,
       JSON.stringify(d.recipients || []), JSON.stringify(d.results || [])]
    )
    res.json({ success: true, campaign: result.rows[0] })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/:id/delete', async (req, res) => {
  try {
    const pool = getPool()
    await pool.query('DELETE FROM email_campaigns WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

module.exports = router
