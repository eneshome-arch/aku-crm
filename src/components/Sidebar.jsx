import { useState } from 'react'
import { Plus, Search, LayoutDashboard, AlertTriangle, Phone, Mail, Settings, Shield } from 'lucide-react'

const platform = window.electronAPI?.platform || 'darwin'

const STATUS_LABELS = {
  1: 'Nicht kontaktiert',
  2: 'Angerufen',
  3: 'Ansprechpartner ermittelt',
  4: 'Gespräch geführt',
  5: 'Unterlagen versendet',
  6: 'Nachfassen',
  7: 'Rahmenvertrag angefragt',
  8: 'Rahmenvertrag erhalten',
  9: 'Aktiver Kunde',
  10: 'Kein Interesse',
}

const STATUS_COLORS = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700',
  4: 'bg-purple-100 text-purple-700',
  5: 'bg-orange-100 text-orange-700',
  6: 'bg-yellow-100 text-yellow-700',
  7: 'bg-teal-100 text-teal-700',
  8: 'bg-green-100 text-green-700',
  9: 'bg-emerald-100 text-emerald-800',
  10: 'bg-red-100 text-red-700',
}

function formatDate(dt) {
  if (!dt) return null
  const d = new Date(dt)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isOverdue(dt) {
  if (!dt) return false
  return new Date(dt) < new Date()
}

export default function Sidebar({ contacts, selectedContact, onSelectContact, onShowDashboard, onAddContact, onFindCustomers, onStartCalling, onEmailMarketing, onOpenSettings, onOpenAdmin, currentView, isAdmin }) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(0)

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      c.company_name?.toLowerCase().includes(q) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Title bar area — nur auf macOS für Traffic Lights */}
      {platform === 'darwin' ? (
        <div className="drag-region h-12 flex items-center px-4 pt-2 flex-shrink-0">
          <div className="no-drag ml-auto">
            <button
              onClick={onAddContact}
              className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
              title="Kontakt hinzufügen"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div className="h-4 flex-shrink-0" />
      )}

      {/* App title */}
      <div className="px-4 pb-3 flex-shrink-0 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">CRM Akquise</h1>
        {platform !== 'darwin' && (
          <button
            onClick={onAddContact}
            className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors"
            title="Kontakt hinzufügen"
          >
            <Plus size={15} />
          </button>
        )}
      </div>

      {/* Nav buttons */}
      <div className="px-3 mb-2 flex-shrink-0 space-y-1">
        <button
          onClick={onShowDashboard}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
            currentView === 'dashboard'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard size={15} />
          Dashboard
        </button>
        <button
          onClick={onFindCustomers}
          className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 transition-colors flex items-center gap-2"
        >
          <Search size={15} />
          Kunden finden
        </button>
        <button
          onClick={onStartCalling}
          className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2"
        >
          <Phone size={15} />
          Anrufsession starten
        </button>
        <button
          onClick={onEmailMarketing}
          className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-2"
        >
          <Mail size={15} />
          E-Mail Marketing
        </button>
      </div>

      {/* Search */}
      <div className="px-3 mb-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="px-3 mb-3 flex-shrink-0">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(Number(e.target.value))}
          className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
        >
          <option value={0}>Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Contact count */}
      <div className="px-4 mb-2 flex-shrink-0">
        <span className="text-xs text-gray-400 font-medium">{filtered.length} Kontakte</span>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            Keine Kontakte gefunden
          </div>
        ) : (
          filtered.map(contact => {
            const overdue = isOverdue(contact.next_followup)
            const isSelected = selectedContact?.id === contact.id
            return (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all ${
                  isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {contact.company_name}
                    </p>
                    {(contact.first_name || contact.last_name) && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                      </p>
                    )}
                    {contact.next_followup && (
                      <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        {overdue && <AlertTriangle size={11} />}
                        {formatDate(contact.next_followup)}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${STATUS_COLORS[contact.status] || STATUS_COLORS[1]}`}>
                    {contact.status}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 space-y-1">
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              currentView === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-purple-500 hover:bg-purple-50'
            }`}
          >
            <Shield size={15} />
            Admin Panel
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
            currentView === 'settings' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Settings size={15} />
          Einstellungen
        </button>
      </div>
    </aside>
  )
}
