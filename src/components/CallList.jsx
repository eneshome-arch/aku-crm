import { useState } from 'react'
import { Phone, X, GripVertical, ChevronRight, Search, Clock, AlertTriangle } from 'lucide-react'

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

function isOverdue(dt) {
  if (!dt) return false
  const d = new Date(dt)
  const today = new Date(); today.setHours(0,0,0,0)
  return d < today
}

function isToday(dt) {
  if (!dt) return false
  return new Date(dt).toDateString() === new Date().toDateString()
}

export default function CallList({ contacts, onStart, onClose }) {
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('followup') // 'followup' | 'all'

  const followupContacts = contacts.filter(c =>
    (isOverdue(c.next_followup) || isToday(c.next_followup)) && c.status !== 9 && c.status !== 10
  )

  const displayContacts = (tab === 'followup' ? followupContacts : contacts).filter(c => {
    const q = search.toLowerCase()
    return !q || c.company_name?.toLowerCase().includes(q) || `${c.first_name} ${c.last_name}`.toLowerCase().includes(q)
  })

  const toggle = (contact) => {
    setSelected(prev =>
      prev.find(c => c.id === contact.id)
        ? prev.filter(c => c.id !== contact.id)
        : [...prev, contact]
    )
  }

  const isSelected = (c) => selected.some(s => s.id === c.id)

  const moveUp = (i) => {
    if (i === 0) return
    const next = [...selected]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    setSelected(next)
  }

  const moveDown = (i) => {
    if (i === selected.length - 1) return
    const next = [...selected]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    setSelected(next)
  }

  const remove = (i) => setSelected(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col" style={{ height: '88vh' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Anrufliste erstellen</h3>
            <p className="text-xs text-gray-400 mt-0.5">Wähle die Kontakte aus, die du heute anrufen willst</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Linke Seite: Kontakte auswählen */}
          <div className="flex-1 flex flex-col border-r border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setTab('followup')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${tab === 'followup' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  <Clock size={12} /> Followup heute ({followupContacts.length})
                </button>
                <button
                  onClick={() => setTab('all')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors ${tab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  Alle Kontakte
                </button>
              </div>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {displayContacts.length === 0 && (
                <p className="text-center py-8 text-sm text-gray-400">Keine Kontakte gefunden</p>
              )}
              {displayContacts.map(c => {
                const sel = isSelected(c)
                const overdue = isOverdue(c.next_followup)
                const phone = c.phone_central || c.phone_direct || c.mobile
                return (
                  <button
                    key={c.id}
                    onClick={() => toggle(c)}
                    className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all border-2 ${
                      sel ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900 truncate">{c.company_name}</p>
                          {overdue && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                          {phone && <span className="ml-2 text-gray-400">{phone}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>
                          {c.status}
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${sel ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                          {sel && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rechte Seite: Reihenfolge */}
          <div className="w-72 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Anrufreihenfolge ({selected.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2">
              {selected.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Phone size={32} className="mx-auto mb-2 text-gray-200" />
                  <p className="text-xs">Kontakte auswählen</p>
                </div>
              )}
              {selected.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-2.5 mb-1 bg-gray-50 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveUp(i)} disabled={i === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 leading-none">▲</button>
                    <button onClick={() => moveDown(i)} disabled={i === selected.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 leading-none">▼</button>
                  </div>
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{c.company_name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.phone_central || c.phone_direct || c.mobile || 'Kein Telefon'}</p>
                  </div>
                  <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => selected.length > 0 && onStart(selected)}
                disabled={selected.length === 0}
                className="w-full py-3 text-sm font-bold bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Anrufsession starten
                {selected.length > 0 && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
