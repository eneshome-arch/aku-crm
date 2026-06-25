import { useState, useEffect } from 'react'
import { Users, Trash2, KeyRound, CheckCircle, RefreshCw, Shield, Building2, X, AlertTriangle, ChevronRight, Search } from 'lucide-react'
import AdminUserDetail from './AdminUserDetail'

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function DeleteConfirmModal({ user, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">User löschen?</h3>
            <p className="text-sm text-gray-500 mt-0.5">{user.name} ({user.email})</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5 bg-red-50 px-4 py-3 rounded-xl">
          Alle Kontakte und Daten dieses Users werden unwiderruflich gelöscht.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Trash2 size={14} /> Löschen</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetPasswordModal({ user, onClose, onDone }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (pw.length < 4) { setError('Mindestens 4 Zeichen.'); return }
    setLoading(true)
    const res = await window.electronAPI.adminResetPassword(user.id, pw)
    setLoading(false)
    if (res.success) {
      setDone(true)
      setTimeout(() => { onDone(); onClose() }, 1200)
    } else {
      setError(res.error || 'Fehler')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Passwort zurücksetzen</h3>
            <p className="text-sm text-gray-500 mt-0.5">{user.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        <input
          type="text"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          placeholder="Neues Passwort eingeben..."
          autoFocus
          className="w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white mb-3"
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleReset}
            disabled={loading || pw.length < 4}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              done ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white'
            }`}
          >
            {done
              ? <><CheckCircle size={14} /> Gesetzt!</>
              : loading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><KeyRound size={14} /> Setzen</>}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [resetUser, setResetUser] = useState(null)
  const [deleteUser, setDeleteUser] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [detailUserId, setDetailUserId] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.adminGetUsers()
      if (res.success) setUsers(res.users)
      else setError(res.error || 'Fehler beim Laden')
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!deleteUser) return
    setDeleting(true)
    await window.electronAPI.adminDeleteUser(deleteUser.id)
    setDeleting(false)
    setDeleteUser(null)
    load()
  }

  const totalContacts = users.reduce((sum, u) => sum + Number(u.contact_count || 0), 0)
  const regularUsers = users.filter(u => !u.is_admin)

  const filtered = users.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const birthdateStr = u.birthdate ? new Date(u.birthdate).toLocaleDateString('de-DE') : ''
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      birthdateStr.includes(q)
    )
  })

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8 pt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-sm text-gray-500">Benutzerverwaltung & Systemübersicht</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{regularUsers.length}</p>
            <p className="text-xs text-gray-500 font-medium">Benutzer</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
            <p className="text-xs text-gray-500 font-medium">Kontakte gesamt</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.is_admin).length}</p>
            <p className="text-xs text-gray-500 font-medium">Admins</p>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <h2 className="text-base font-bold text-gray-900 flex-shrink-0">Alle Benutzer</h2>
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Name, E-Mail oder Geburtsdatum (TT.MM.JJJJ)…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          {search && (
            <span className="text-xs text-gray-400 flex-shrink-0">{filtered.length} Treffer</span>
          )}
        </div>

        {error && (
          <div className="m-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Keine Benutzer gefunden</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(user => (
              <div
                key={user.id}
                onClick={() => setDetailUserId(user.id)}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    {user.is_admin && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">Admin</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                {/* Meta */}
                <div className="hidden lg:flex items-center gap-6 text-xs text-gray-400 flex-shrink-0">
                  <span>{user.city || '—'}</span>
                  <span><strong className="text-gray-700">{user.contact_count}</strong> Kontakte</span>
                  <span>seit {formatDate(user.created_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                  {!user.is_admin && (
                    <>
                      <button
                        onClick={() => setResetUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <KeyRound size={13} />
                        Passwort
                      </button>
                      <button
                        onClick={() => setDeleteUser(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 size={13} />
                        Löschen
                      </button>
                    </>
                  )}
                  <ChevronRight size={15} className="text-gray-300 group-hover:text-gray-500 transition-colors ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {resetUser && (
        <ResetPasswordModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onDone={load}
        />
      )}

      {detailUserId && (
        <AdminUserDetail
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
        />
      )}

      {deleteUser && (
        <DeleteConfirmModal
          user={deleteUser}
          loading={deleting}
          onClose={() => setDeleteUser(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}
