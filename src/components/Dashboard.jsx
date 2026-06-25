import { AlertCircle, Clock, Users, UserCheck, FileText, Mail, MailCheck, MailX, Send } from 'lucide-react'

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
  1: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  2: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  3: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  4: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  5: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  6: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  7: { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  8: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  9: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  10: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
}

// Welche Status sind sinnvoll für E-Mail Marketing
const EMAIL_RELEVANT_STATUS = [1, 2, 3, 4, 5, 6, 7, 8]

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function isToday(dt) {
  if (!dt) return false
  return new Date(dt).toDateString() === new Date().toDateString()
}

function isOverdue(dt) {
  if (!dt) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dt) < today
}

export default function Dashboard({ contacts, onSelectContact, onEmailMarketing }) {
  const today = contacts.filter(c => c.next_followup && isToday(c.next_followup))
  const overdue = contacts.filter(c => c.next_followup && isOverdue(c.next_followup))
  const activeCustomers = contacts.filter(c => c.status === 9).length
  const frameContracts = contacts.filter(c => c.status === 8 || c.status === 7).length

  const statusCounts = {}
  for (let i = 1; i <= 10; i++) {
    statusCounts[i] = contacts.filter(c => c.status === i).length
  }

  // E-Mail Marketing Stats
  const withEmail = contacts.filter(c => c.email)
  const withoutEmail = contacts.filter(c => !c.email)
  const relevantWithEmail = withEmail.filter(c => EMAIL_RELEVANT_STATUS.includes(c.status))
  const emailByStatus = EMAIL_RELEVANT_STATUS
    .map(s => ({
      status: s,
      label: STATUS_LABELS[s],
      colors: STATUS_COLORS[s],
      count: contacts.filter(c => c.status === s && c.email).length,
      total: contacts.filter(c => c.status === s).length,
    }))
    .filter(s => s.total > 0)

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-4">
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Kontakte</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{overdue.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Überfällig</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <UserCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{activeCustomers}</p>
              <p className="text-xs text-gray-500 mt-0.5">Aktive Kunden</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{frameContracts}</p>
              <p className="text-xs text-gray-500 mt-0.5">Rahmenverträge</p>
            </div>
          </div>
        </div>

        {/* Overdue & Today followups */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" />
                Überfällig ({overdue.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {overdue.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">Keine überfälligen Followups</p>
              ) : overdue.map(c => (
                <button key={c.id} onClick={() => onSelectContact(c)}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm text-gray-900">{c.company_name}</p>
                  <p className="text-xs text-red-500">{formatDate(c.next_followup)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={14} className="text-blue-500" />
                Heute fällig ({today.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
              {today.length === 0 ? (
                <p className="px-5 py-4 text-sm text-gray-400">Keine Followups für heute</p>
              ) : today.map(c => (
                <button key={c.id} onClick={() => onSelectContact(c)}
                  className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm text-gray-900">{c.company_name}</p>
                  <p className="text-xs text-gray-400">{c.followup_note || 'Kein Hinweis'}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline + E-Mail Marketing nebeneinander */}
        <div className="grid grid-cols-2 gap-6 mb-6">

          {/* Pipeline */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Pipeline Übersicht</h3>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => {
                const k = Number(key)
                const count = statusCounts[k] || 0
                const colors = STATUS_COLORS[k]
                const pct = contacts.length > 0 ? Math.round((count / contacts.length) * 100) : 0
                return (
                  <div key={key} className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${colors.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                      <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${colors.text} opacity-60`}>{pct}%</span>
                      <span className={`text-base font-bold ${colors.text} w-6 text-right`}>{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* E-Mail Marketing */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Mail size={15} className="text-purple-500" />
                E-Mail Marketing
              </h3>
              <button
                onClick={onEmailMarketing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
              >
                <Send size={12} />
                Kampagne starten
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 flex-1">
              {/* Erreichbarkeit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 flex items-center gap-3">
                  <MailCheck size={18} className="text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-green-700">{withEmail.length}</p>
                    <p className="text-xs text-green-600">Mit E-Mail</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  <MailX size={18} className="text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xl font-bold text-gray-500">{withoutEmail.length}</p>
                    <p className="text-xs text-gray-400">Ohne E-Mail</p>
                  </div>
                </div>
              </div>

              {/* Erreichbarkeits-Balken */}
              {contacts.length > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Erreichbarkeit</span>
                    <span>{contacts.length > 0 ? Math.round((withEmail.length / contacts.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-400 rounded-full transition-all"
                      style={{ width: `${contacts.length > 0 ? (withEmail.length / contacts.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Kampagnen-Potenzial */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Kampagnen-Potenzial nach Status
                </p>
                <div className="space-y-1.5">
                  {emailByStatus.length === 0 ? (
                    <p className="text-xs text-gray-400">Keine Kontakte mit E-Mail</p>
                  ) : emailByStatus.map(s => (
                    <div key={s.status} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[s.status].dot}`} />
                      <span className="text-xs text-gray-600 flex-1 truncate">{s.label}</span>
                      <span className="text-xs font-semibold text-gray-700">{s.count}</span>
                      <span className="text-xs text-gray-400">/ {s.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {relevantWithEmail.length > 0 && (
                <div className="mt-auto pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    <span className="font-bold text-purple-600">{relevantWithEmail.length} Kontakte</span> bereit für die nächste Kampagne
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
