import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, MapPin, Fingerprint, ChevronRight, LogIn } from 'lucide-react'

const platform = window.electronAPI?.platform || 'darwin'
const isMac = platform === 'darwin'

// Session in electron-store speichern/lesen
async function getSavedSession() {
  const s = await window.electronAPI.getSettings()
  return s.savedSession || null
}
async function saveSession(userId, email, name) {
  await window.electronAPI.setSetting('savedSession', { userId, email, name })
}
async function clearSession() {
  await window.electronAPI.setSetting('savedSession', null)
}

function CityAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setSuggestions([])
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (val) => {
    onChange(val)
    clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5&lang=de`)
        const json = await res.json()
        setSuggestions(json.features || [])
      } catch {}
    }, 300)
  }

  const pick = (f) => {
    const city = f.properties.city || f.properties.name || ''
    const [lon, lat] = f.geometry.coordinates
    onChange(city)
    setSuggestions([])
    onSelect({ city, lat, lon })
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="Deine Stadt"
          className="w-full pl-8 pr-3 py-3 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((f, i) => {
            const p = f.properties
            const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ')
            return (
              <button key={i} type="button" onMouseDown={() => pick(f)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Touch ID Screen (macOS) ─────────────────────────────────────────────────
function TouchIdScreen({ session, onLogin, onSwitchAccount }) {
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState('')

  const handleTouchId = async () => {
    setStatus('loading')
    setError('')
    const res = await window.electronAPI.touchId('Bei Aku CRM anmelden')
    if (!res.success) {
      setStatus('error')
      setError('Touch ID fehlgeschlagen. Versuch es erneut.')
      return
    }
    const userRes = await window.electronAPI.getUserById(session.userId)
    if (!userRes.success) {
      setStatus('error')
      setError('Session abgelaufen. Bitte neu anmelden.')
      await clearSession()
      return
    }
    setStatus('idle')
    onLogin(userRes.user)
  }

  // Touch ID automatisch beim Öffnen starten
  useEffect(() => { handleTouchId() }, [])

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl font-bold text-blue-600">
          {session.name?.charAt(0)?.toUpperCase()}
        </span>
      </div>
      <h2 className="text-lg font-bold text-gray-900">Willkommen zurück</h2>
      <p className="text-sm text-gray-500 mt-1 mb-8">{session.name}</p>

      <button
        onClick={handleTouchId}
        disabled={status === 'loading'}
        className="w-full py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold transition-colors flex items-center justify-center gap-3 mb-3"
      >
        {status === 'loading' ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Touch ID…
          </>
        ) : (
          <>
            <Fingerprint size={20} />
            Mit Touch ID anmelden
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl mb-3">{error}</p>
      )}

      <button
        onClick={onSwitchAccount}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mx-auto"
      >
        Anderes Konto verwenden <ChevronRight size={13} />
      </button>
    </div>
  )
}

// ── Normales Login / Registrierung ─────────────────────────────────────────
function LoginForm({ prefillEmail, onLogin }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '', email: prefillEmail || '', password: '',
    city: '', lat: 52.3759, lon: 9.7320,
    address: '', birthdate: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(!!prefillEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const res = await window.electronAPI.login({ email: form.email, password: form.password })
        if (res.success) {
          if (rememberMe) await saveSession(res.user.id, res.user.email, res.user.name)
          else await clearSession()
          onLogin(res.user)
        } else {
          setError(res.error)
        }
      } else {
        if (!form.name.trim()) { setError('Bitte Namen eingeben.'); setLoading(false); return }
        const res = await window.electronAPI.register({
          name: form.name, email: form.email, password: form.password,
          city: form.city, lat: form.lat, lon: form.lon,
          address: form.address, birthdate: form.birthdate || null,
        })
        if (res.success) {
          if (rememberMe) await saveSession(res.user.id, res.user.email, res.user.name)
          else await clearSession()
          onLogin(res.user)
        } else {
          setError(res.error)
        }
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const inputClass = "w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {mode === 'register' && (
        <input type="text" placeholder="Dein Name" value={form.name}
          onChange={set('name')} required className={inputClass} />
      )}

      <input type="email" placeholder="E-Mail Adresse" value={form.email}
        onChange={set('email')} required className={inputClass} />

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Passwort"
          value={form.password}
          onChange={set('password')}
          required
          className={inputClass + ' pr-10'}
        />
        <button type="button" onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {mode === 'register' && (
        <>
          <input type="text" placeholder="Adresse (Straße, Hausnummer, PLZ, Ort)"
            value={form.address} onChange={set('address')} className={inputClass} />
          <div>
            <label className="block text-xs text-gray-400 mb-1 ml-1">Geburtsdatum</label>
            <input type="date" value={form.birthdate} onChange={set('birthdate')}
              className={inputClass} />
          </div>
          <CityAutocomplete
            value={form.city}
            onChange={(val) => setForm(f => ({ ...f, city: val }))}
            onSelect={({ city, lat, lon }) => setForm(f => ({ ...f, city, lat, lon }))}
          />
        </>
      )}

      {/* Angemeldet bleiben */}
      <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
        <div
          onClick={() => setRememberMe(v => !v)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
            rememberMe ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'
          }`}
        >
          {rememberMe && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span className="text-sm text-gray-600">
          {isMac ? 'Angemeldet bleiben (Touch ID)' : 'E-Mail merken'}
        </span>
      </label>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl">{error}</p>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
        {loading
          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : <><LogIn size={16} /> {mode === 'login' ? 'Anmelden' : 'Account erstellen'}</>}
      </button>

      <div className="text-center pt-1">
        {mode === 'login' ? (
          <p className="text-sm text-gray-400">
            Noch kein Account?{' '}
            <button type="button" onClick={() => { setMode('register'); setError('') }}
              className="text-blue-500 font-medium hover:underline">
              Registrieren
            </button>
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            Bereits registriert?{' '}
            <button type="button" onClick={() => { setMode('login'); setError('') }}
              className="text-blue-500 font-medium hover:underline">
              Anmelden
            </button>
          </p>
        )}
      </div>
    </form>
  )
}

// ── Haupt-Login-Komponente ──────────────────────────────────────────────────
export default function Login({ onLogin }) {
  const [screen, setScreen] = useState('loading') // loading | touchid | form
  const [savedSession, setSavedSession] = useState(null)

  useEffect(() => {
    getSavedSession().then(session => {
      if (session?.userId && isMac) {
        setSavedSession(session)
        setScreen('touchid')
      } else {
        setSavedSession(session)
        setScreen('form')
      }
    })
  }, [])

  const handleLogin = (user) => onLogin(user)

  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center h-screen bg-gray-50 ${isMac ? 'drag-region' : ''}`}>
      <div className="no-drag w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        {/* Logo */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Aku CRM</h1>
          {screen === 'form' && (
            <p className="text-sm text-gray-400 mt-1">
              {savedSession && !isMac ? savedSession.name + ' — Passwort eingeben' : 'Meld dich an'}
            </p>
          )}
        </div>

        {screen === 'touchid' && savedSession ? (
          <TouchIdScreen
            session={savedSession}
            onLogin={handleLogin}
            onSwitchAccount={async () => {
              await clearSession()
              setSavedSession(null)
              setScreen('form')
            }}
          />
        ) : (
          <LoginForm
            prefillEmail={savedSession?.email || ''}
            onLogin={handleLogin}
          />
        )}
      </div>
    </div>
  )
}
