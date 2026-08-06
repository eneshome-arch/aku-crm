const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'aku-crm-secret-change-in-production'

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, isAdmin: user.is_admin },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

function requireAuth(req, res, next) {
  const token = req.cookies?.aku_token || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ success: false, error: 'Nicht authentifiziert' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Token ungültig' })
  }
}

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ success: false, error: 'Keine Admin-Berechtigung' })
  next()
}

module.exports = { signToken, requireAuth, requireAdmin, JWT_SECRET }
