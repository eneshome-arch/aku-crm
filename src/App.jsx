import { useState, useEffect, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
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
  const [dbStatus, setDbStatus] = useState('connecting') // 'connecting' | 'ok' | 'error'
  const [dbError, setDbError] = useState('')

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
        const res = await window.electronAPI.init()
        if (res.success) {
          setDbStatus('ok')
        } else {
          setDbStatus('error')
          setDbError(res.error || 'Unbekannter Fehler')
        }
      } catch (err) {
        setDbStatus('error')
        setDbError(err.message)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadContacts(currentUser.id)
    }
  }, [currentUser])

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

  if (dbStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Datenbankfehler</h2>
          <p className="text-gray-500 text-sm">{dbError}</p>
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
