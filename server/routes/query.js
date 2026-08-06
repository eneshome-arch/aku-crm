const express = require('express')
const { getPool } = require('../db')

const router = express.Router()

// Raw SQL passthrough — JWT-protected, replicates Electron's db:query
router.post('/', async (req, res) => {
  try {
    const { sql, params } = req.body
    const pool = getPool()
    const result = await pool.query(sql, params || [])
    res.json({ rows: result.rows, rowCount: result.rowCount })
  } catch (err) {
    res.json({ error: err.message })
  }
})

module.exports = router
