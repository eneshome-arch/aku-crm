import { useState } from 'react'
import { Plus, Search, LayoutDashboard, AlertTriangle, Phone, Mail, Settings, Shield, FileText, Building2, Users } from 'lucide-react'

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

export default function Sidebar({ contacts, selectedContact, onSelectContact, onShowDashboard, onAddContact, onFindCustomers, onStartCalling, onEmailMarketing, onOpenSettings, onOpenAdmin, onOpenAngebote, onOpenKunden, currentView, isAdmin }) {
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

      {/* Search */}
      <div className="px-3 mb-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Suchen"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-10 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-300 font-medium">⌘K</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-3 mb-1 flex-shrink-0 space-y-1">
        <button
          onClick={onShowDashboard}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
            currentView === 'dashboard'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard size={16} />
          Dashboard
        </button>
        <button
          onClick={onOpenKunden}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
            currentView === 'kunden' || currentView === 'contact'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Building2 size={16} />
          Kunden & CRM
        </button>
        <button
          onClick={onOpenAngebote}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
            currentView === 'angebote'
              ? 'bg-blue-50 text-blue-600'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <FileText size={16} />
          Belege
        </button>
      </div>

      {/* Aktionen */}
      <div className="px-3 mb-2 flex-shrink-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-2">Aktionen</p>
        <div className="space-y-1">
          <button
            onClick={onFindCustomers}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 transition-colors flex items-center gap-3"
          >
            <Search size={16} />
            Kunden finden
          </button>
          <button
            onClick={onStartCalling}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-3"
          >
            <Phone size={16} />
            Anrufsession
          </button>
          <button
            onClick={onEmailMarketing}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-3"
          >
            <Mail size={16} />
            E-Mail Marketing
          </button>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0 space-y-1">
        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
              currentView === 'admin' ? 'bg-purple-50 text-purple-700' : 'text-purple-500 hover:bg-purple-50'
            }`}
          >
            <Shield size={16} />
            Admin Panel
          </button>
        )}
        <button
          onClick={onOpenSettings}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
            currentView === 'settings' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Settings size={16} />
          Einstellungen
        </button>
      </div>
    </aside>
  )
}
