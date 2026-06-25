import { useState, useEffect } from 'react'
import { X, Mail, MapPin, Building2, TrendingUp, PhoneCall, AlertTriangle, Clock, Star, CakeSlice, Home, Shield } from 'lucide-react'

const STATUS_LABELS = {
  1: 'Nicht kontaktiert', 2: 'Angerufen', 3: 'Ansprechpartner', 4: 'Gespräch geführt',
  5: 'Unterlagen versendet', 6: 'Nachfassen', 7: 'RV angefragt',
  8: 'RV erhalten', 9: 'Aktiver Kunde', 10: 'Kein Interesse',
}
const STATUS_COLORS = {
  1: 'bg-gray-100 text-gray-600', 2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700', 4: 'bg-purple-100 text-purple-700',
  5: 'bg-orange-100 text-orange-700', 6: 'bg-yellow-100 text-yellow-700',
  7: 'bg-teal-100 text-teal-700', 8: 'bg-green-100 text-green-700',
  9: 'bg-emerald-100 text-emerald-800', 10: 'bg-red-100 text-red-700',
}

function fmt(n) {
  if (!n) return '0'
  return Number(n).toLocaleString('de-DE')
}
function fmtEur(n) {
  if (!n) return '—'
  return Number(n).toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
function fmtDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }
  return (
    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function AdminUserDetail({ userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.electronAPI.adminGetUserDetail(userId).then(res => {
      if (res.success) setData(res)
      else setError(res.error)
      setLoading(false)
    })
  }, [userId])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          {data ? (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg flex-shrink-0">
                {data.user.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{data.user.name}</h2>
                <p className="text-sm text-gray-500">{data.user.email}</p>
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-bold text-gray-900">User Details</h2>
          )}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="py-16 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {data && (
            <div className="space-y-6">

              {/* Private Daten — Legitimation */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Legitimationsdaten (Support-Bereich)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">E-Mail</p>
                      <p className="text-gray-800 font-medium">{data.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CakeSlice size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Geburtsdatum</p>
                      <p className="text-gray-800 font-medium">{data.user.birthdate ? fmtDate(data.user.birthdate) : '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Home size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Adresse</p>
                      <p className="text-gray-800 font-medium">{data.user.address || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Standort</p>
                      <p className="text-gray-800 font-medium">{data.user.city || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Registriert am</p>
                      <p className="text-gray-800 font-medium">{fmtDate(data.user.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">E-Mail-Konto</p>
                      <p className="text-gray-800 font-medium">{data.user.email_config?.email || 'Nicht verbunden'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistiken */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Statistiken</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatCard icon={Building2} label="Kontakte gesamt" value={fmt(data.stats.total_contacts)} color="blue" />
                  <StatCard icon={PhoneCall} label="Anrufe gesamt" value={fmt(data.stats.total_calls)} color="purple" />
                  <StatCard icon={Star} label="Aktive Kunden" value={fmt(data.stats.active_customers)} color="green" />
                  <StatCard icon={TrendingUp} label="Umsatzpotenzial" value={fmtEur(data.stats.total_revenue)} color="orange" />
                  <StatCard icon={AlertTriangle} label="Überfällig" value={fmt(data.stats.overdue)} color="red" />
                  <StatCard icon={CheckCircle} label="Mit E-Mail" value={fmt(data.contacts.filter(c => c.status >= 2).length)} color="blue" />
                </div>
              </div>

              {/* Status-Verteilung */}
              {data.contacts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status-Verteilung</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(
                      data.contacts.reduce((acc, c) => {
                        acc[c.status] = (acc[c.status] || 0) + 1
                        return acc
                      }, {})
                    ).sort(([a], [b]) => Number(a) - Number(b)).map(([status, count]) => (
                      <div key={status} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
                        <span>{STATUS_LABELS[status]}</span>
                        <span className="opacity-70">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kontaktliste */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Kontakte ({data.contacts.length})
                </h3>
                {data.contacts.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Keine Kontakte</p>
                ) : (
                  <div className="space-y-2">
                    {data.contacts.map(c => {
                      const overdue = c.next_followup && new Date(c.next_followup) < new Date()
                      return (
                        <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 truncate">{c.company_name}</p>
                              {c.industry && <span className="text-xs text-gray-400 hidden sm:inline">{c.industry}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              {c.city && <span className="text-xs text-gray-400">{c.city}</span>}
                              {c.next_followup && (
                                <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                                  {overdue && <AlertTriangle size={10} />}
                                  {fmtDateTime(c.next_followup)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {c.revenue_potential && (
                              <span className="text-xs text-gray-500 hidden sm:inline">{fmtEur(c.revenue_potential)}</span>
                            )}
                            {Number(c.call_count) > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <PhoneCall size={11} />{c.call_count}
                              </span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[c.status]}`}>
                              {STATUS_LABELS[c.status]}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}
