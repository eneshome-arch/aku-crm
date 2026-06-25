import { useState, useEffect, useCallback } from 'react'
import { Phone, PhoneOff, ChevronRight, SkipForward, X, Clock, CheckCircle } from 'lucide-react'

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

const QUICK_RESULTS = [
  'Nicht erreicht',
  'Rückruf vereinbart',
  'Kein Interesse',
  'Interesse vorhanden',
  'Unterlagen angefordert',
  'Ansprechpartner ermittelt',
  'Voicemail hinterlassen',
]

function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const start = () => { setSeconds(0); setRunning(true) }
  const stop = () => setRunning(false)
  const reset = () => { setSeconds(0); setRunning(false) }

  const format = () => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return { seconds, running, start, stop, reset, format }
}

export default function CallSession({ contacts, onClose, onSessionEnd }) {
  const [index, setIndex] = useState(0)
  const [calling, setCalling] = useState(false)
  const [result, setResult] = useState('')
  const [notes, setNotes] = useState('')
  const [newStatus, setNewStatus] = useState(null)
  const [done, setDone] = useState(false)
  const [summary, setSummary] = useState([])
  const timer = useTimer()

  const contact = contacts[index]
  const phone = contact?.phone_central || contact?.phone_direct || contact?.mobile

  const startCall = useCallback(() => {
    if (phone) {
      window.open(`tel:${phone.replace(/\s/g, '')}`)
    }
    setCalling(true)
    timer.start()
  }, [phone, timer])

  // Auto-startet den Anruf wenn neuer Kontakt erscheint (außer beim ersten)
  useEffect(() => {
    if (index > 0 && contact) {
      setTimeout(() => startCall(), 800)
    }
  }, [index])

  const saveAndNext = async () => {
    timer.stop()

    // Anruf in Historie speichern
    if (result || notes) {
      await window.electronAPI.query(
        `INSERT INTO call_history (contact_id, call_date, result, notes) VALUES ($1, NOW(), $2, $3)`,
        [contact.id, result || 'Angerufen', notes]
      )
    }

    // Status aktualisieren falls geändert
    const statusToSave = newStatus || (result === 'Kein Interesse' ? 10 : result === 'Interesse vorhanden' ? 4 : 2)
    await window.electronAPI.query(
      `UPDATE contacts SET status=$1, updated_at=NOW() WHERE id=$2`,
      [statusToSave, contact.id]
    )

    setSummary(prev => [...prev, {
      name: contact.company_name,
      result: result || 'Kein Ergebnis',
      duration: timer.format(),
    }])

    // Weiter oder fertig
    if (index < contacts.length - 1) {
      setResult('')
      setNotes('')
      setNewStatus(null)
      setCalling(false)
      timer.reset()
      setIndex(i => i + 1)
    } else {
      setDone(true)
      onSessionEnd()
    }
  }

  const skip = async () => {
    timer.stop()
    timer.reset()
    setResult('')
    setNotes('')
    setNewStatus(null)
    setCalling(false)
    setSummary(prev => [...prev, { name: contact.company_name, result: 'Übersprungen', duration: '—' }])
    if (index < contacts.length - 1) {
      setIndex(i => i + 1)
    } else {
      setDone(true)
      onSessionEnd()
    }
  }

  // Fertig-Ansicht
  if (done) {
    return (
      <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Session abgeschlossen!</h2>
            <p className="text-gray-500 mt-1">{contacts.length} Anrufe durchgeführt</p>
          </div>
          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
            {summary.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.result}</p>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={11} /> {s.duration}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-xl mx-4">

        {/* Fortschritt */}
        <div className="mb-4 flex items-center justify-between px-1">
          <span className="text-white/60 text-sm font-medium">{index + 1} / {contacts.length} Anrufe</span>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-6">
          <div
            className="bg-blue-400 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${((index) / contacts.length) * 100}%` }}
          />
        </div>

        {/* Haupt-Karte */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Kontakt-Info */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-gray-100">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={28} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{contact?.company_name}</h2>
            {(contact?.first_name || contact?.last_name) && (
              <p className="text-gray-500 mt-1">{[contact.first_name, contact.last_name].filter(Boolean).join(' ')} · {contact.position || ''}</p>
            )}
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="inline-block mt-3 text-2xl font-bold text-blue-500 hover:text-blue-600 tracking-wide"
              >
                {phone}
              </a>
            ) : (
              <p className="mt-3 text-gray-400 text-sm">Keine Telefonnummer hinterlegt</p>
            )}
            {calling && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                <Clock size={14} />
                <span>{timer.format()}</span>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            )}
          </div>

          {/* Aktionen */}
          <div className="px-8 py-6">
            {!calling ? (
              <button
                onClick={startCall}
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-2xl transition-colors flex items-center justify-center gap-3 shadow-lg shadow-green-200"
              >
                <Phone size={22} />
                Jetzt anrufen
              </button>
            ) : (
              <div className="space-y-4">
                {/* Quick Results */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ergebnis</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_RESULTS.map(r => (
                      <button
                        key={r}
                        onClick={() => setResult(r)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
                          result === r
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status aktualisieren</p>
                  <select
                    value={newStatus || contact?.status || 1}
                    onChange={e => setNewStatus(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{k}. {v}</option>
                    ))}
                  </select>
                </div>

                {/* Notizen */}
                <textarea
                  rows={2}
                  placeholder="Kurze Notiz zum Gespräch..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />

                {/* Weiter Button */}
                <button
                  onClick={saveAndNext}
                  className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  {index < contacts.length - 1 ? (
                    <>Speichern & Weiter <ChevronRight size={20} /></>
                  ) : (
                    <>Session beenden <CheckCircle size={20} /></>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Überspringen */}
          <div className="px-8 pb-6 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {contacts.slice(index + 1, index + 3).map((c, i) => (
                <span key={i} className="mr-2">↳ {c.company_name}</span>
              ))}
            </div>
            <button
              onClick={skip}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <SkipForward size={13} /> Überspringen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
