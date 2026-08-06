const express = require('express')
const { getPool } = require('../db')

const router = express.Router()

const DOC_PREFIXES = { angebot: 'ZB', rahmenvertrag: 'RV', rechnung: 'RG', lieferschein: 'LS', gutschrift: 'GS' }

router.get('/', async (req, res) => {
  try {
    const pool = getPool()
    const result = await pool.query('SELECT * FROM offers WHERE user_id=$1 ORDER BY created_at DESC', [req.query.userId])
    res.json({ success: true, offers: result.rows })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const d = req.body
    const pool = getPool()

    if (d.id) {
      // Update
      const result = await pool.query(
        `UPDATE offers SET title=$1, items=$2, notes=$3, tax_rate=$4, subtotal=$5, tax_amount=$6, total=$7,
         company_name=$8, company_address=$9, contact_person=$10, status=$11, valid_until=$12, contact_id=$13,
         doc_type=$14, due_date=$15, service_location=$16, processor=$17, intro_text=$18, template=$19,
         updated_at=NOW()
         WHERE id=$20 AND user_id=$21 RETURNING *`,
        [d.title, JSON.stringify(d.items), d.notes, d.taxRate, d.subtotal, d.taxAmount, d.total,
         d.companyName, d.companyAddress, d.contactPerson, d.status, d.validUntil || null, d.contactId || null,
         d.docType || 'angebot', d.dueDate || null, d.serviceLocation || '', d.processor || '',
         d.introText || '', d.template || 'zeitblick',
         d.id, d.userId]
      )
      res.json({ success: true, offer: result.rows[0] })
    } else {
      // Generate number
      const docType = d.docType || 'angebot'
      const prefix = DOC_PREFIXES[docType] || 'ZB'
      const year = new Date().getFullYear()
      const countRes = await pool.query(
        `SELECT COUNT(*) FROM offers WHERE user_id=$1 AND doc_type=$2 AND EXTRACT(YEAR FROM created_at)=$3`,
        [d.userId, docType, year]
      )
      const num = (parseInt(countRes.rows[0].count) || 0) + 1
      const offerNumber = `${prefix}-${year}-${String(num).padStart(3, '0')}`

      const result = await pool.query(
        `INSERT INTO offers (user_id, offer_number, title, items, notes, tax_rate, subtotal, tax_amount, total,
         company_name, company_address, contact_person, status, valid_until, contact_id, doc_type,
         due_date, service_location, processor, intro_text, template)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21) RETURNING *`,
        [d.userId, offerNumber, d.title, JSON.stringify(d.items), d.notes, d.taxRate, d.subtotal,
         d.taxAmount, d.total, d.companyName, d.companyAddress, d.contactPerson, d.status || 'entwurf',
         d.validUntil || null, d.contactId || null, docType,
         d.dueDate || null, d.serviceLocation || '', d.processor || '',
         d.introText || '', d.template || 'zeitblick']
      )
      res.json({ success: true, offer: result.rows[0] })
    }
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/:id/delete', async (req, res) => {
  try {
    const pool = getPool()
    await pool.query('DELETE FROM offers WHERE id=$1 AND user_id=$2', [req.params.id, req.body.userId])
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

// PDF generation
router.post('/pdf', async (req, res) => {
  try {
    const { html, filename } = req.body
    let puppeteer
    try {
      puppeteer = require('puppeteer')
    } catch {
      return res.status(500).json({ success: false, error: 'Puppeteer nicht installiert' })
    }
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'dokument.pdf'}"`)
    res.send(pdfBuffer)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

module.exports = router
