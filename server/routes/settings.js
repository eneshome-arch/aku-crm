const express = require('express')
const { getPool } = require('../db')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT web_settings FROM users WHERE id=$1', [req.user.userId])
    const settings = result.rows[0]?.web_settings || {}
    res.json(settings)
  } catch (err) {
    res.json({})
  }
})

router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    const pool = getPool()
    await pool.query(
      `UPDATE users SET web_settings = jsonb_set(COALESCE(web_settings, '{}'), $1, $2) WHERE id=$3`,
      [`{${key}}`, JSON.stringify(value), req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

module.exports = router
