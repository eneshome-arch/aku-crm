const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function get(path) {
  const res = await fetch(BASE + path, { credentials: 'include' })
  return res.json()
}

async function del(path) {
  const res = await fetch(BASE + path, { method: 'DELETE', credentials: 'include' })
  return res.json()
}

export const webAPI = {
  // DB — no-ops on web (server handles init)
  init: () => Promise.resolve({ success: true }),
  dbConfigure: () => Promise.resolve({ success: true }),
  dbGetConfig: () => Promise.resolve({}),
  dbIsConfigured: () => Promise.resolve(true),

  // Auth
  login: (data) => post('/api/auth/login', data),
  register: (data) => post('/api/auth/register', data),
  getUserById: (userId) => get(`/api/auth/user/${userId}`),
  updateProfile: (userId, data) => post('/api/auth/profile', { ...data, userId }),
  touchId: () => Promise.resolve({ success: false }),

  // Raw query
  query: (sql, params) => post('/api/query', { sql, params }),

  // Offers
  offersList: (userId) => get(`/api/offers?userId=${userId}`),
  offersSave: (data) => post('/api/offers', data),
  offersDelete: (offerId, userId) => post(`/api/offers/${offerId}/delete`, { userId }),
  offersExportPdf: async ({ html, filename }) => {
    const res = await fetch(BASE + '/api/offers/pdf', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, filename }),
    })
    if (!res.ok) return { success: false, error: 'PDF-Fehler' }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || 'dokument.pdf'
    a.click()
    URL.revokeObjectURL(url)
    return { success: true }
  },

  // Campaigns
  campaignsSave: (data) => post('/api/campaigns', data),
  campaignsList: (userId) => get(`/api/campaigns?userId=${userId}`),
  campaignsGet: (id) => get(`/api/campaigns/${id}`),
  campaignsDelete: (id) => post(`/api/campaigns/${id}/delete`, {}),

  // Email
  testEmail: (config) => post('/api/email/test', { config }),
  sendEmails: (config, recipients) => post('/api/email/send', { config, recipients }),

  // Admin
  adminGetUsers: () => get('/api/admin/users'),
  adminGetUserDetail: (userId) => get(`/api/admin/users/${userId}`),
  adminDeleteUser: (userId) => del(`/api/admin/users/${userId}`),
  adminResetPassword: (userId, newPassword) => post(`/api/admin/users/${userId}/password`, { newPassword }),

  // Settings (replaces electron-store)
  getSettings: () => get('/api/settings'),
  setSetting: (key, value) => post(`/api/settings/${key}`, { value }),

  // Notes
  notesList: (userId) => get(`/api/notes?userId=${userId}`),
  notesSave: (userId, text) => post('/api/notes', { userId, text }),
  notesDelete: (noteId, userId) => post(`/api/notes/${noteId}/delete`, { userId }),

  // Fetch / Scrape
  extract: (url) => post('/api/fetch/extract', { url }),
  overpass: (query) => post('/api/fetch/overpass', { query }),

  // Window — no-ops on web
  windowMinimize: () => {},
  windowMaximize: () => {},
  windowClose: () => {},
  windowIsMaximized: () => Promise.resolve(false),
  onWindowMaximized: () => {},
  onUpdateAvailable: () => {},
  onUpdateReady: () => {},
  installUpdate: () => {},

  // Platform
  platform: 'web',
}
