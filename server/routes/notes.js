const express = require('express')
const { getPool } = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id=$1 ORDER BY created_at DESC',
      [req.query.userId]
    )
    res.json({ success: true, notes: result.rows })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { userId, text } = req.body
    const pool = getPool()
    const result = await pool.query(
      'INSERT INTO notes (user_id, text) VALUES ($1, $2) RETURNING *',
      [userId, text]
    )
    res.json({ success: true, note: result.rows[0] })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/:id/delete', async (req, res) => {
  try {
    const pool = getPool()
    await pool.query('DELETE FROM notes WHERE id=$1 AND user_id=$2', [req.params.id, req.body.userId])
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

module.exports = router
