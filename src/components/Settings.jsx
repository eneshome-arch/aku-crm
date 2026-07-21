import { useState, useEffect, useRef } from 'react'
import { Mail, CheckCircle, XCircle, Eye, EyeOff, ChevronDown, User, MapPin, LogOut, Moon, Sun, Bell, Globe, Camera } from 'lucide-react'

const PROVIDERS = [
  { label: 'Microsoft Outlook / Hotmail', value: 'outlook', host: 'smtp-mail.outlook.com', port: 587 },
  { label: 'Office 365 / Microsoft 365', value: 'office365', host: 'smtp.office365.com', port: 587 },
  { label: 'Gmail', value: 'gmail', host: 'smtp.gmail.com', port: 587, hint: 'Bei Gmail ein App-Passwort unter myaccount.google.com → Sicherheit erstellen.' },
  { label: 'GMX', value: 'gmx', host: 'mail.gmx.net', port: 587 },
  { label: 'Web.de', value: 'webde', host: 'smtp.web.de', port: 587 },
  { label: 'Eigener SMTP-Server', value: 'custom', host: '', port: 587 },
]

const inputClass = "w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"

function Field({ label, children }) {
  return (
    <div className="mb-5">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-blue-500' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
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
          className={inputClass + ' pl-8'}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((f, i) => {
            const p = f.properties
            const label = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ')
            return (
              <button
                key={i}
                type="button"
                onMouseDown={() => pick(f)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ProfileSection({ currentUser, onProfileUpdated }) {
  const [name, setName] = useState(currentUser?.name || '')
  const [city, setCity] = useState(currentUser?.city || '')
  const [coords, setCoords] = useState({ lat: currentUser?.lat || 52.3759, lon: currentUser?.lon || 9.7320 })
  const [address, setAddress] = useState(currentUser?.address || '')
  const [birthdate, setBirthdate] = useState(
    currentUser?.birthdate ? currentUser.birthdate.substring(0, 10) : ''
  )
  const [avatar, setAvatar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    async function loadAvatar() {
      const s = await window.electronAPI?.getSettings?.()
      if (s?.[`avatar_${currentUser?.id}`]) setAvatar(s[`avatar_${currentUser?.id}`])
    }
    loadAvatar()
  }, [currentUser?.id])

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const b64 = ev.target.result
      setAvatar(b64)
      window.electronAPI?.setSetting?.(`avatar_${currentUser?.id}`, b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await window.electronAPI.updateProfile(currentUser.id, {
      name,
      city,
      lat: coords.lat,
      lon: coords.lon,
      email_config: currentUser.email_config || null,
      address,
      birthdate: birthdate || null,
    })
    setSaving(false)
    if (res.success) {
      setSaved(true)
      onProfileUpdated(res.user)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <User size={20} className="text-gray-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mein Profil</h2>
          <p className="text-sm text-gray-500">Name, Foto und Standort</p>
        </div>
      </div>

      <div className="max-w-lg">
        {/* Profilbild */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            {avatar
              ? <img src={avatar} alt="Profilbild" className="w-20 h-20 rounded-2xl object-cover" />
              : <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
                  <User size={32} className="text-gray-400" />
                </div>
            }
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{name || 'Kein Name'}</p>
            <p className="text-xs text-gray-400">{currentUser?.email}</p>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-500 hover:underline mt-1">
              Foto ändern
            </button>
          </div>
        </div>

        <Field label="Name">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dein Name" className={inputClass} />
        </Field>

        <Field label="E-Mail">
          <input type="email" value={currentUser?.email || ''} disabled className={inputClass + ' opacity-50 cursor-not-allowed'} />
        </Field>

        <Field label="Adresse">
          <input type="text" value={address} onChange={e => setAddress(e.target.value)}
            placeholder="Musterstraße 1, 30159 Hannover" className={inputClass} />
        </Field>

        <Field label="Geburtsdatum">
          <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
            className={inputClass} />
        </Field>

        <Field label="Standort (für Kundensuche)">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            onSelect={({ city: c, lat, lon }) => {
              setCity(c)
              setCoords({ lat, lon })
            }}
          />
          {coords.lat && (
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
            </p>
          )}
        </Field>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className={`w-full py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white'
          }`}
        >
          {saved ? <><CheckCircle size={15} /> Gespeichert!</> : saving ? 'Speichern...' : 'Profil speichern'}
        </button>
      </div>
    </div>
  )
}

function EmailSection({ currentUser, onProfileUpdated }) {
  const [provider, setProvider] = useState('outlook')
  const [config, setConfig] = useState({ host: 'smtp-mail.outlook.com', port: 587, email: '', password: '', senderName: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (currentUser?.email_config) {
      const ec = currentUser.email_config
      setConfig(ec)
      const p = PROVIDERS.find(p => p.host === ec.host)
      setProvider(p ? p.value : 'custom')
    }
  }, [currentUser])

  const handleProviderChange = (val) => {
    setProvider(val)
    const p = PROVIDERS.find(p => p.value === val)
    if (p) setConfig(c => ({ ...c, host: p.host, port: p.port }))
    setTestResult(null)
  }

  const set = (field) => (e) => {
    setConfig(c => ({ ...c, [field]: e.target.value }))
    setTestResult(null)
    setSaved(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await window.electronAPI.testEmail(config)
    setTesting(false)
    setTestResult(res)
  }

  const handleSave = async () => {
    const res = await window.electronAPI.updateProfile(currentUser.id, {
      name: currentUser.name,
      city: currentUser.city,
      lat: currentUser.lat,
      lon: currentUser.lon,
      email_config: config,
    })
    if (res.success) {
      onProfileUpdated(res.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const selectedProvider = PROVIDERS.find(p => p.value === provider)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Mail size={20} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">E-Mail Konto</h2>
          <p className="text-sm text-gray-500">Verbinde deinen E-Mail-Account für automatischen Versand</p>
        </div>
      </div>

      <div className="max-w-lg">
        <Field label="E-Mail Anbieter">
          <div className="relative">
            <select value={provider} onChange={e => handleProviderChange(e.target.value)} className={inputClass + ' appearance-none pr-8'}>
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          {selectedProvider?.hint && (
            <p className="text-xs text-amber-600 mt-2 bg-amber-50 px-3 py-2 rounded-xl">{selectedProvider.hint}</p>
          )}
        </Field>

        {provider === 'custom' && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">SMTP Host</label>
              <input type="text" value={config.host} onChange={set('host')} placeholder="mail.example.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Port</label>
              <input type="number" value={config.port} onChange={e => setConfig(c => ({ ...c, port: Number(e.target.value) }))} className={inputClass} />
            </div>
          </div>
        )}

        <Field label="Absender Name">
          <input type="text" value={config.senderName} onChange={set('senderName')} placeholder="Max Mustermann" className={inputClass} />
        </Field>

        <Field label="E-Mail Adresse">
          <input type="email" value={config.email} onChange={set('email')} placeholder="deine@email.de" className={inputClass} />
        </Field>

        <Field label="Passwort">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={config.password}
              onChange={set('password')}
              placeholder="••••••••"
              className={inputClass + ' pr-10'}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        {testResult && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-5 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {testResult.success
              ? <><CheckCircle size={16} /> Verbindung erfolgreich!</>
              : <><XCircle size={16} /> {testResult.error}</>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !config.email || !config.password}
            className="flex-1 py-3 text-sm font-semibold border-2 border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {testing
              ? <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> Testen...</>
              : <><Mail size={15} /> Verbindung testen</>}
          </button>
          <button
            onClick={handleSave}
            disabled={!config.email || !config.password}
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white'
            }`}
          >
            {saved ? <><CheckCircle size={15} /> Gespeichert!</> : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AppearanceSection({ darkMode, onSetDarkMode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          {darkMode ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-yellow-500" />}
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Erscheinungsbild</h2>
          <p className="text-sm text-gray-500">Helligkeit und Design anpassen</p>
        </div>
      </div>

      <div className="max-w-lg space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-800">Dark Mode</p>
            <p className="text-xs text-gray-500 mt-0.5">Dunkles Design für die Augen</p>
          </div>
          <Toggle value={darkMode} onChange={onSetDarkMode} />
        </div>
      </div>
    </div>
  )
}

function LanguageSection({ language, onSetLanguage }) {
  const LANGUAGES = [
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Globe size={20} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Sprache</h2>
          <p className="text-sm text-gray-500">Anzeigesprache der App</p>
        </div>
      </div>

      <div className="max-w-lg space-y-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.value}
            onClick={() => onSetLanguage(lang.value)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
              language === lang.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-transparent bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className={`text-sm font-semibold ${language === lang.value ? 'text-blue-700' : 'text-gray-800'}`}>
              {lang.label}
            </span>
            {language === lang.value && <CheckCircle size={16} className="ml-auto text-blue-500" />}
          </button>
        ))}
        <p className="text-xs text-gray-400 pt-2 pl-1">Die vollständige Übersetzung wird schrittweise eingeführt.</p>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    followup: true,
    newContact: false,
    email: true,
    sound: true,
  })

  useEffect(() => {
    async function load() {
      const s = await window.electronAPI?.getSettings?.()
      if (s?.notifications) setPrefs(p => ({ ...p, ...s.notifications }))
    }
    load()
  }, [])

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    window.electronAPI?.setSetting?.('notifications', next)
  }

  const items = [
    { key: 'followup', label: 'Follow-up Erinnerungen', desc: 'Benachrichtigung wenn ein Follow-up fällig ist' },
    { key: 'newContact', label: 'Neuer Kontakt', desc: 'Benachrichtigung wenn ein Kontakt hinzugefügt wird' },
    { key: 'email', label: 'E-Mail Versand', desc: 'Benachrichtigung nach erfolgreichem E-Mail Versand' },
    { key: 'sound', label: 'Ton', desc: 'Benachrichtigungston aktivieren' },
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Bell size={20} className="text-orange-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Benachrichtigungen</h2>
          <p className="text-sm text-gray-500">Wähle welche Benachrichtigungen du erhalten möchtest</p>
        </div>
      </div>

      <div className="max-w-lg space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <Toggle value={prefs[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'profile', label: 'Mein Profil', icon: User },
  { id: 'appearance', label: 'Erscheinungsbild', icon: Sun },
  { id: 'language', label: 'Sprache', icon: Globe },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
  { id: 'email', label: 'E-Mail Konto', icon: Mail },
]

export default function Settings({ currentUser, onProfileUpdated, onLogout, darkMode, onSetDarkMode, language, onSetLanguage }) {
  const [activeSection, setActiveSection] = useState('profile')

  return (
    <div className="h-full flex overflow-hidden bg-gray-50">
      {/* Linke Nav */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 pt-8">
        <div className="px-5 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Einstellungen</h2>
        </div>
        <nav className="px-3 space-y-1 flex-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={activeSection === item.id ? 'text-blue-500' : 'text-gray-400'} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="px-3 pb-6">
          <button
            onClick={onLogout}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-3"
          >
            <LogOut size={16} className="text-red-400" />
            Abmelden
          </button>
        </div>
      </div>

      {/* Rechter Inhalt */}
      <div className="flex-1 overflow-y-auto p-8 pt-12">
        {activeSection === 'profile' && (
          <ProfileSection currentUser={currentUser} onProfileUpdated={onProfileUpdated} />
        )}
        {activeSection === 'appearance' && (
          <AppearanceSection darkMode={darkMode} onSetDarkMode={onSetDarkMode} />
        )}
        {activeSection === 'language' && (
          <LanguageSection language={language} onSetLanguage={onSetLanguage} />
        )}
        {activeSection === 'notifications' && (
          <NotificationsSection />
        )}
        {activeSection === 'email' && (
          <EmailSection currentUser={currentUser} onProfileUpdated={onProfileUpdated} />
        )}
      </div>
    </div>
  )
}
