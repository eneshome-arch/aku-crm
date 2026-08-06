const express = require('express')
const https = require('https')
const http = require('http')

const router = express.Router()

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'AkuCRM/1.0' } }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const mod = parsed.protocol === 'https:' ? https : http
    const req = mod.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AkuCRM/1.0' },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// Extract contact info from URL
router.post('/extract', async (req, res) => {
  try {
    const { url } = req.body
    const html = await httpGet(url)
    // Parse JSON-LD
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    let data = {}
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1])
        data = {
          name: ld.name || '',
          phone: ld.telephone || '',
          email: ld.email || '',
          address: ld.address?.streetAddress || '',
          city: ld.address?.addressLocality || '',
          postal_code: ld.address?.postalCode || '',
          website: url,
        }
      } catch {}
    }
    // Fallback: OG tags
    if (!data.name) {
      const ogName = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      if (ogName) data.name = ogName[1]
    }
    res.json({ success: true, data })
  } catch (err) {
    res.json({ success: false, error: err.message })
  }
})

// Overpass API proxy
router.post('/overpass', async (req, res) => {
  const { query } = req.body
  const servers = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ]
  for (const server of servers) {
    try {
      const result = await httpPost(server, `data=${encodeURIComponent(query)}`)
      const parsed = JSON.parse(result)
      return res.json({ success: true, elements: parsed.elements || [] })
    } catch {
      continue
    }
  }
  res.json({ success: false, error: 'Alle Overpass-Server nicht erreichbar' })
})

module.exports = router
