import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, Database } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import ContactProfile from './components/ContactProfile'
import ContactForm from './components/ContactForm'
import FindCustomers from './components/FindCustomers'
import CallList from './components/CallList'
import CallSession from './components/CallSession'
import EmailMarketing from './components/EmailMarketing'
import Settings from './components/Settings'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import WindowsTitleBar from './components/WindowsTitleBar'
import AngeboteModule from './components/AngeboteModule'

const platform = window.electronAPI?.platform || 'darwin'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [contacts, setContacts] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'contact' | 'settings' | 'admin'
  const [showAddForm, setShowAddForm] = useState(false)
  const [showFindCustomers, setShowFindCustomers] = useState(false)
  const [showCallList, setShowCallList] = useState(false)
  const [callSession, setCallSession] = useState(null)
  const [showEmailMarketing, setShowEmailMarketing] = useState(false)
  const [dbStatus, setDbStatus] = useState('connecting') // 'connecting' | 'ok' | 'error' | 'setup'
  const [dbError, setDbError] = useState('')
  const [dbSetup, setDbSetup] = useState({ host: '', port: '5432', user: 'postgres', password: '', database: 'postgres' })
  const [dbSetupLoading, setDbSetupLoading] = useState(false)
  const [dbSetupError, setDbSetupError] = useState('')
  const [updateStatus, setUpdateStatus] = useState(null) // null | 'available' | 'ready'

  const loadContacts = useCallback(async (userId) => {
    const uid = userId || currentUser?.id
    if (!uid) return
    const res = await window.electronAPI.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM call_history WHERE contact_id = c.id) as call_count
       FROM contacts c
       WHERE c.user_id = $1
       ORDER BY
         CASE WHEN c.next_followup < NOW() AND c.next_followup IS NOT NULL THEN 0 ELSE 1 END,
         c.next_followup ASC NULLS LAST,
         c.company_name ASC`,
      [uid]
    )
    if (res.rows) setContacts(res.rows)
  }, [currentUser])

  useEffect(() => {
    async function init() {
      try {
        const configured = await window.electronAPI.dbIsConfigured()
        if (!configured) {
          const saved = await window.electronAPI.dbGetConfig()
          if (saved && saved.host) setDbSetup(s => ({ ...s, ...saved }))
          setDbStatus('setup')
          return
        }
        const res = await window.electronAPI.init()
        if (res && res.success) {
          setDbStatus('ok')
        } else {
          setDbStatus('setup')
          setDbSetupError(res?.error || 'Verbindung fehlgeschlagen')
        }
      } catch (err) {
        setDbStatus('setup')
        setDbSetupError(err.message)
      }
    }
    init()
  }, [])

  const handleDbSetup = async (e) => {
    e.preventDefault()
    setDbSetupLoading(true)
    setDbSetupError('')
    try {
      const res = await window.electronAPI.dbConfigure(dbSetup)
      if (res.success) {
        const initRes = await window.electronAPI.init()
        if (initRes && initRes.success) {
          setDbStatus('ok')
        } else {
          setDbSetupError(initRes?.error || 'Initialisierung fehlgeschlagen')
        }
      } else {
        setDbSetupError(res.error || 'Verbindung fehlgeschlagen')
      }
    } catch (err) {
      setDbSetupError(err.message)
    } finally {
      setDbSetupLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadContacts(currentUser.id)
    }
  }, [currentUser])

  useEffect(() => {
    window.electronAPI?.onUpdateAvailable?.(() => setUpdateStatus('available'))
    window.electronAPI?.onUpdateReady?.(() => setUpdateStatus('ready'))
  }, [])

  const handleLogin = (user) => {
    setCurrentUser(user)
  }

  const handleLogout = () => {
    // Session bleibt gespeichert → nächster Start per Touch ID möglich
    setCurrentUser(null)
    setContacts([])
    setSelectedContact(null)
    setView('dashboard')
  }

  const handleSelectContact = (contact) => {
    setSelectedContact(contact)
    setView('contact')
  }

  const handleShowDashboard = () => {
    setSelectedContact(null)
    setView('dashboard')
  }

  const handleContactSaved = async () => {
    await loadContacts()
    setShowAddForm(false)
  }

  const handleContactUpdated = async (updatedContact) => {
    await loadContacts()
    if (updatedContact) {
      setSelectedContact(updatedContact)
    }
  }

  const handleContactDeleted = async () => {
    await loadContacts()
    setSelectedContact(null)
    setView('dashboard')
  }

  const handleProfileUpdated = (updatedUser) => {
    setCurrentUser(updatedUser)
  }

  if (dbStatus === 'connecting') {
    return <div className="h-screen bg-gray-50" />
  }

  if (dbStatus === 'setup') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Database size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Datenbankverbindung</h2>
              <p className="text-sm text-gray-500">Einmalige Einrichtung</p>
            </div>
          </div>
          <form onSubmit={handleDbSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Server (Host)</label>
              <input type="text" required value={dbSetup.host} onChange={e => setDbSetup(s => ({ ...s, host: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. 46.224.59.145" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input type="text" value={dbSetup.port} onChange={e => setDbSetup(s => ({ ...s, port: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datenbank</label>
                <input type="text" value={dbSetup.database} onChange={e => setDbSetup(s => ({ ...s, database: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername</label>
              <input type="text" value={dbSetup.user} onChange={e => setDbSetup(s => ({ ...s, user: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
              <input type="password" required value={dbSetup.password} onChange={e => setDbSetup(s => ({ ...s, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {dbSetupError && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle size={16} /> {dbSetupError}
              </div>
            )}
            <button type="submit" disabled={dbSetupLoading}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {dbSetupLoading ? 'Verbinde...' : 'Verbinden & Speichern'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {platform === 'win32' && <WindowsTitleBar />}
      {updateStatus === 'ready' && (
        <div className="bg-green-600 text-white text-sm px-4 py-2 flex items-center justify-between z-50">
          <span>Update bereit — App wird nach dem Neustart aktualisiert.</span>
          <button onClick={() => window.electronAPI.installUpdate()} className="bg-white text-green-700 font-medium px-3 py-1 rounded-lg text-xs hover:bg-green-50 transition-colors">
            Jetzt neu starten
          </button>
        </div>
      )}
      {updateStatus === 'available' && (
        <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-between z-50">
          <span>Update wird heruntergeladen...</span>
          <button onClick={() => setUpdateStatus(null)} className="text-blue-200 hover:text-white text-xs">✕</button>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
      <Sidebar
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={handleSelectContact}
        onShowDashboard={handleShowDashboard}
        onAddContact={() => setShowAddForm(true)}
        onFindCustomers={() => setShowFindCustomers(true)}
        onStartCalling={() => setShowCallList(true)}
        onEmailMarketing={() => setShowEmailMarketing(true)}
        onOpenSettings={() => { setSelectedContact(null); setView('settings') }}
        onOpenAdmin={() => { setSelectedContact(null); setView('admin') }}
        onOpenAngebote={() => { setSelectedContact(null); setView('angebote') }}
        currentView={view}
        isAdmin={currentUser?.is_admin}
      />

      <main className="flex-1 overflow-hidden">
        {view === 'dashboard' && (
          <Dashboard
            contacts={contacts}
            onSelectContact={handleSelectContact}
            onEmailMarketing={() => setShowEmailMarketing(true)}
          />
        )}
        {view === 'contact' && selectedContact && (
          <ContactProfile
            contact={selectedContact}
            onUpdated={handleContactUpdated}
            onDeleted={handleContactDeleted}
          />
        )}
        {view === 'settings' && (
          <Settings
            currentUser={currentUser}
            onProfileUpdated={handleProfileUpdated}
            onLogout={handleLogout}
          />
        )}
        {view === 'admin' && currentUser?.is_admin && <AdminPanel />}
        {view === 'angebote' && <AngeboteModule currentUser={currentUser} />}
      </main>

      {showAddForm && (
        <ContactForm
          userId={currentUser.id}
          onSaved={handleContactSaved}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {showFindCustomers && (
        <FindCustomers
          userId={currentUser.id}
          userLat={currentUser.lat}
          userLon={currentUser.lon}
          onAddContact={loadContacts}
          onClose={() => setShowFindCustomers(false)}
        />
      )}

      {showCallList && (
        <CallList
          contacts={contacts}
          onStart={(selected) => { setShowCallList(false); setCallSession(selected) }}
          onClose={() => setShowCallList(false)}
        />
      )}

      {callSession && (
        <CallSession
          contacts={callSession}
          onSessionEnd={loadContacts}
          onClose={() => setCallSession(null)}
        />
      )}

      {showEmailMarketing && (
        <EmailMarketing
          contacts={contacts}
          currentUser={currentUser}
          onClose={() => setShowEmailMarketing(false)}
          onOpenSettings={() => { setShowEmailMarketing(false); setView('settings') }}
        />
      )}
      </div>
    </div>
  )
}
