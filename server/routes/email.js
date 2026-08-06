const express = require('express')
const nodemailer = require('nodemailer')

const router = express.Router()

router.post('/test', async (req, res) => {
  try {
    const config = req.body.config || req.body
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.email, pass: config.password },
      tls: { rejectUnauthorized: false },
    })
    await transporter.verify()
    res.json({ success: true })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

router.post('/send', async (req, res) => {
  try {
    const { config, recipients } = req.body
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
          from: config.senderName ? `"${config.senderName}" <${config.email}>` : config.email,
          to: r.email,
          subject: r.subject,
          html: r.html,
        })
        results.push({ email: r.email, success: true })
      } catch (err) {
        results.push({ email: r.email, success: false, error: err.message })
      }
    }
    res.json({ success: true, results })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

module.exports = router
