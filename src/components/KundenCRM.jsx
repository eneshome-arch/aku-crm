import { useState, useEffect, useCallback } from 'react'
import {
  Users, Building2, Kanban, BarChart3, Activity,
  Search, ArrowUpDown, Phone, MapPin, ChevronRight,
  TrendingUp, CalendarClock, PhoneCall, DollarSign,
  Clock, FileText
} from 'lucide-react'

const STATUS_LABELS = {
  1: 'Nicht kontaktiert',
  2: 'Angerufen',
  3: 'Ansprechpartner ermittelt',
  4: 'Gespraech gefuehrt',
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

const PIPELINE_BG = {
  1: 'bg-gray-50 border-gray-200',
  2: 'bg-blue-50 border-blue-200',
  3: 'bg-indigo-50 border-indigo-200',
  4: 'bg-purple-50 border-purple-200',
  5: 'bg-orange-50 border-orange-200',
  6: 'bg-yellow-50 border-yellow-200',
  7: 'bg-teal-50 border-teal-200',
  8: 'bg-green-50 border-green-200',
  9: 'bg-emerald-50 border-emerald-200',
  10: 'bg-red-50 border-red-200',
}

const TYPE_LABEL = {
  hospital: 'Krankenhaus',
  nursing_home: 'Pflegeheim',
  assisted_living: 'Betreutes Wohnen',
  ambulatory_care: 'Ambulante Pflege',
  home_care: 'Ambulante Pflege',
  rehabilitation: 'Reha Klinik',
}

const TYPE_COLOR = {
  hospital: 'bg-red-100 text-red-700',
  nursing_home: 'bg-blue-100 text-blue-700',
  assisted_living: 'bg-indigo-100 text-indigo-700',
  ambulatory_care: 'bg-teal-100 text-teal-700',
  home_care: 'bg-teal-100 text-teal-700',
  rehabilitation: 'bg-purple-100 text-purple-700',
}

const INITIALS_COLORS = [
  'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-pink-500'
]

function getInitialsColor(name) {
  if (!name) return INITIALS_COLORS[0]
  const code = name.charCodeAt(0)
  return INITIALS_COLORS[code % INITIALS_COLORS.length]
}

function getInitials(name) {
  if (!name) return '??'
  return name.substring(0, 2).toUpperCase()
}

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// ─── Sub-views ─────────────────────────────────────────────

function KontakteView({ contacts, onSelectContact, search, setSearch, filterStatus, setFilterStatus, sortBy, setSortBy, title = 'Kontakte' }) {
  const withRevenue = contacts.filter(c => c.revenue_potential > 0).length

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.company_name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q) ||
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return (a.company_name || '').localeCompare(b.company_name || '')
    if (sortBy === 'umsatz') return (b.revenue_potential || 0) - (a.revenue_potential || 0)
    if (sortBy === 'stadt') return (a.city || '').localeCompare(b.city || '')
    return 0
  })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{contacts.length} Eintraege</p>
      </div>

      {/* Stats row */}
      <div className="px-6 pb-4 flex gap-4 flex-shrink-0">
        <div className="bg-blue-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Users size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-blue-700">{contacts.length}</span>
          <span className="text-xs text-blue-500">Gesamt</span>
        </div>
        <div className="bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <DollarSign size={15} className="text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-700">{withRevenue}</span>
          <span className="text-xs text-emerald-500">Mit Umsatz</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 pb-3 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Name, Branche, Stadt..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="px-6 pb-4 flex items-center gap-3 flex-shrink-0">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(Number(e.target.value))}
          className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
        >
          <option value={0}>Alle Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="flex gap-1 ml-auto">
          {[['name', 'Name'], ['umsatz', 'Umsatz'], ['stadt', 'Stadt']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sortBy === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {sorted.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Keine Kontakte gefunden</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map(contact => (
              <button
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="w-full text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-50 transition-all flex items-center gap-3 group border border-gray-100 hover:border-gray-200"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getInitialsColor(contact.company_name)}`}>
                  {getInitials(contact.company_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{contact.company_name}</p>
                    {contact.industry && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLOR[contact.industry] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[contact.industry] || contact.industry}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {(contact.phone_central || contact.phone_direct || contact.mobile) && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <Phone size={10} />
                        {contact.phone_central || contact.phone_direct || contact.mobile}
                      </span>
                    )}
                    {contact.city && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                        <MapPin size={10} />
                        {contact.postal_code ? contact.postal_code + ' ' : ''}{contact.city}
                      </span>
                    )}
                    {(contact.first_name || contact.last_name) && (
                      <span className="text-xs text-gray-400 truncate">
                        {[contact.first_name, contact.last_name].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[contact.status] || STATUS_COLORS[1]}`}>
                  {STATUS_LABELS[contact.status] || 'Unbekannt'}
                </span>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineView({ contacts, onSelectContact }) {
  const grouped = {}
  for (let s = 1; s <= 10; s++) grouped[s] = []
  contacts.forEach(c => {
    const s = c.status || 1
    if (grouped[s]) grouped[s].push(c)
  })

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">Pipeline</h2>
        <p className="text-sm text-gray-500 mt-0.5">Kontakte nach Status</p>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <div className="flex gap-3 h-full" style={{ minWidth: 'max-content' }}>
          {Object.entries(grouped).map(([status, list]) => (
            <div key={status} className={`w-56 flex-shrink-0 rounded-xl border p-3 flex flex-col ${PIPELINE_BG[status] || 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-700 truncate">{STATUS_LABELS[status]}</h3>
                <span className="text-xs font-semibold text-gray-500 bg-white rounded-full px-2 py-0.5">{list.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Leer</p>
                ) : (
                  list.map(c => (
                    <button
                      key={c.id}
                      onClick={() => onSelectContact(c)}
                      className="w-full text-left bg-white rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow border border-white hover:border-gray-200"
                    >
                      <div className="flex items-center gap-1">
                        <p className="text-xs font-semibold text-gray-800 truncate">{c.company_name}</p>
                        {c.industry && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLOR[c.industry] || 'bg-gray-100 text-gray-600'}`}>{TYPE_LABEL[c.industry] || c.industry}</span>}
                      </div>
                      {(c.first_name || c.last_name) && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                        </p>
                      )}
                      {c.city && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <MapPin size={9} /> {c.city}
                        </p>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BerichteView({ contacts, currentUser }) {
  const [callsThisMonth, setCallsThisMonth] = useState(0)

  useEffect(() => {
    async function loadCalls() {
      if (!currentUser?.id) return
      try {
        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const res = await window.electronAPI.query(
          `SELECT COUNT(*) as cnt FROM call_history ch JOIN contacts c ON ch.contact_id = c.id WHERE c.user_id = $1 AND ch.call_date >= $2`,
          [currentUser.id, firstOfMonth]
        )
        if (res.rows?.[0]) setCallsThisMonth(Number(res.rows[0].cnt))
      } catch (e) {
        console.error('Failed to load call stats:', e)
      }
    }
    loadCalls()
  }, [currentUser])

  const totalRevenue = contacts.reduce((sum, c) => sum + (Number(c.revenue_potential) || 0), 0)
  const overdue = contacts.filter(c => c.next_followup && new Date(c.next_followup) < new Date()).length

  const statusCounts = {}
  contacts.forEach(c => {
    const s = c.status || 1
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })

  const maxCount = Math.max(...Object.values(statusCounts), 1)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-bold text-gray-900">Berichte</h2>
        <p className="text-sm text-gray-500 mt-0.5">Uebersicht und Statistiken</p>
      </div>

      {/* Stat cards */}
      <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Kontakte gesamt</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString('de-DE')} EUR</p>
          <p className="text-xs text-gray-500 mt-0.5">Umsatzpotenzial</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <CalendarClock size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{overdue}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ueberfaellige Follow-ups</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <PhoneCall size={16} className="text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{callsThisMonth}</p>
          <p className="text-xs text-gray-500 mt-0.5">Anrufe diesen Monat</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Kontakte nach Status</h3>
          <div className="space-y-2.5">
            {Object.entries(STATUS_LABELS).map(([s, label]) => {
              const count = statusCounts[s] || 0
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-44 truncate">{label}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function AktivitaetsFeedView({ currentUser }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) return
      try {
        const res = await window.electronAPI.query(
          `SELECT ch.*, c.company_name FROM call_history ch JOIN contacts c ON ch.contact_id = c.id WHERE c.user_id = $1 ORDER BY ch.call_date DESC LIMIT 50`,
          [currentUser.id]
        )
        if (res.rows) setActivities(res.rows)
      } catch (e) {
        console.error('Failed to load activities:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentUser])

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900">Aktivitaets-Feed</h2>
        <p className="text-sm text-gray-500 mt-0.5">Letzte Anrufe und Aktivitaeten</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">Lade Aktivitaeten...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Activity size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Noch keine Aktivitaeten vorhanden</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-200" />
            <div className="space-y-1">
              {activities.map((a, i) => (
                <div key={a.id || i} className="relative pl-10 py-3">
                  {/* Dot */}
                  <div className="absolute left-3 top-5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                  <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{a.company_name}</p>
                        {a.result && (
                          <p className="text-xs text-blue-600 font-medium mt-0.5">{a.result}</p>
                        )}
                        {a.notes && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.notes}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                        {formatDateTime(a.call_date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'kontakte', label: 'Kontakte', icon: Users },
  { key: 'kunden', label: 'Kunden', icon: Building2 },
  { key: 'pipeline', label: 'Pipeline', icon: Kanban },
  { key: 'berichte', label: 'Berichte', icon: BarChart3 },
  { key: 'aktivitaeten', label: 'Aktivitaets-Feed', icon: Activity },
]

export default function KundenCRM({ contacts, currentUser, onSelectContact }) {
  const [subView, setSubView] = useState('kontakte')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(0)
  const [sortBy, setSortBy] = useState('name')

  const kundenOnly = contacts.filter(c => c.status === 9)

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left sub-navigation */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-sm font-bold text-gray-900">Kunden & CRM</h2>
          <p className="text-xs text-gray-400 mt-0.5">{contacts.length} Kontakte gesamt</p>
        </div>
        <nav className="px-2 flex-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = subView === item.key
            return (
              <button
                key={item.key}
                onClick={() => setSubView(item.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 mb-0.5 ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {subView === 'kontakte' && (
          <KontakteView
            contacts={contacts}
            onSelectContact={onSelectContact}
            search={search}
            setSearch={setSearch}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            sortBy={sortBy}
            setSortBy={setSortBy}
            title="Kontakte"
          />
        )}
        {subView === 'kunden' && (
          <KontakteView
            contacts={kundenOnly}
            onSelectContact={onSelectContact}
            search={search}
            setSearch={setSearch}
            filterStatus={0}
            setFilterStatus={() => {}}
            sortBy={sortBy}
            setSortBy={setSortBy}
            title="Kunden"
          />
        )}
        {subView === 'pipeline' && (
          <PipelineView contacts={contacts} onSelectContact={onSelectContact} />
        )}
        {subView === 'berichte' && (
          <BerichteView contacts={contacts} currentUser={currentUser} />
        )}
        {subView === 'aktivitaeten' && (
          <AktivitaetsFeedView currentUser={currentUser} />
        )}
      </div>
    </div>
  )
}
