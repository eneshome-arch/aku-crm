import { api } from '../api'
import { useState, useEffect, useRef } from 'react'
import { Mail, CheckCircle, XCircle, Eye, EyeOff, ChevronDown, User, MapPin, LogOut, Moon, Sun, Bell, Globe, Camera, Building2, Phone, Database, Upload, ArrowUp, ArrowDown, X, Plus, HardDrive, FileText } from 'lucide-react'

const PROVIDERS = [
  { label: 'Microsoft Outlook / Hotmail', value: 'outlook', host: 'smtp-mail.outlook.com', port: 587 },
  { label: 'Office 365 / Microsoft 365', value: 'office365', host: 'smtp.office365.com', port: 587 },
  { label: 'Gmail', value: 'gmail', host: 'smtp.gmail.com', port: 587, hint: 'Bei Gmail ein App-Passwort unter myaccount.google.com → Sicherheit erstellen.' },
  { label: 'GMX', value: 'gmx', host: 'mail.gmx.net', port: 587 },
  { label: 'Web.de', value: 'webde', host: 'smtp.web.de', port: 587 },
  { label: 'Strato', value: 'strato', host: 'smtp.strato.de', port: 465, secure: true },
  { label: 'IONOS / 1&1', value: 'ionos', host: 'smtp.1und1.de', port: 587 },
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
      const s = await api.getSettings?.()
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
      api.setSetting?.(`avatar_${currentUser?.id}`, b64)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    const res = await api.updateProfile(currentUser.id, {
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

function CompanySection() {
  const [data, setData] = useState({
    firmenname: '',
    logo: null,
    akzentfarbe: '#1e40af',
    adresse: '',
    plz: '',
    stadt: '',
    telefon: '',
    email: '',
    website: '',
    ustIdNr: '',
    steuernummer: '',
    kontoinhaber: '',
    bank: '',
    iban: '',
    bic: '',
    footerText: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoRef = useRef(null)

  useEffect(() => {
    async function load() {
      const s = await api.getSettings?.()
      if (s?.companyProfile) setData(d => ({ ...d, ...s.companyProfile }))
    }
    load()
  }, [])

  const set = (field) => (e) => setData(d => ({ ...d, [field]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setData(d => ({ ...d, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    await api.setSetting?.('companyProfile', data)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 size={20} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Firmenprofil</h2>
            <p className="text-sm text-gray-500">Für Rechnungen, Angebote und PDFs</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
            saved ? 'bg-green-500 text-white' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white'
          }`}
        >
          {saved ? <><CheckCircle size={14} /> Gespeichert!</> : saving ? 'Speichern...' : 'Speichern'}
        </button>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* FIRMENIDENTITÄT */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Firmenidentität</h3>
          <Field label="Firmenname">
            <input type="text" value={data.firmenname} onChange={set('firmenname')} placeholder="Musterfirma GmbH" className={inputClass} />
          </Field>
          <Field label="Logo">
            <div className="flex items-center gap-4">
              {data.logo && (
                <img src={data.logo} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-200" />
              )}
              <button
                onClick={() => logoRef.current?.click()}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                <Upload size={14} /> Logo auswählen
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </div>
          </Field>
          <Field label="Akzentfarbe">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.akzentfarbe}
                onChange={set('akzentfarbe')}
                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={data.akzentfarbe}
                onChange={set('akzentfarbe')}
                placeholder="#1e40af"
                className={inputClass + ' max-w-[140px]'}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Wird für Tabellenköpfe und Akzente im PDF verwendet</p>
          </Field>
        </div>

        {/* KONTAKTINFORMATIONEN */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Kontaktinformationen</h3>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Adresse</label>
              <input type="text" value={data.adresse} onChange={set('adresse')} placeholder="Musterstraße 1" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PLZ</label>
              <input type="text" value={data.plz} onChange={set('plz')} placeholder="30159" className={inputClass} />
            </div>
          </div>
          <Field label="Stadt">
            <input type="text" value={data.stadt} onChange={set('stadt')} placeholder="Hannover" className={inputClass} />
          </Field>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Telefon</label>
              <input type="text" value={data.telefon} onChange={set('telefon')} placeholder="+49 511 123456" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">E-Mail</label>
              <input type="email" value={data.email} onChange={set('email')} placeholder="info@firma.de" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Website</label>
              <input type="text" value={data.website} onChange={set('website')} placeholder="www.firma.de" className={inputClass} />
            </div>
          </div>
        </div>

        {/* STEUER & RECHTLICHES */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Steuer & Rechtliches</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">UST-IDNr.</label>
              <input type="text" value={data.ustIdNr} onChange={set('ustIdNr')} placeholder="DE123456789" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Steuernummer</label>
              <input type="text" value={data.steuernummer} onChange={set('steuernummer')} placeholder="12/345/67890" className={inputClass} />
            </div>
          </div>
        </div>

        {/* BANKVERBINDUNG */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Bankverbindung</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kontoinhaber</label>
              <input type="text" value={data.kontoinhaber} onChange={set('kontoinhaber')} placeholder="Max Mustermann" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Bank</label>
              <input type="text" value={data.bank} onChange={set('bank')} placeholder="Sparkasse Hannover" className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">IBAN</label>
              <input type="text" value={data.iban} onChange={set('iban')} placeholder="DE89 3704 0044 0532 0130 00" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">BIC</label>
              <input type="text" value={data.bic} onChange={set('bic')} placeholder="COBADEFFXXX" className={inputClass} />
            </div>
          </div>
        </div>

        {/* FUSSZEILE / SONSTIGES */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Fusszeile / Sonstiges</h3>
          <Field label="Footer-Text">
            <textarea
              value={data.footerText}
              onChange={set('footerText')}
              placeholder="z.B. Vielen Dank für Ihr Vertrauen!"
              rows={3}
              className={inputClass + ' resize-none'}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function CallsSection() {
  const [numberPriority, setNumberPriority] = useState([
    'Telefon Zentrale',
    'Telefon Direkt',
    'Mobil',
  ])
  const [vorwahl, setVorwahl] = useState('')
  const [callResults, setCallResults] = useState([
    'Nicht erreicht',
    'Rückruf vereinbart',
    'Kein Interesse',
    'Interesse vorhanden',
    'Unterlagen angefordert',
    'Ansprechpartner ermittelt',
    'Voicemail hinterlassen',
  ])
  const [newResult, setNewResult] = useState('')
  const [script, setScript] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const s = await api.getSettings?.()
      if (s?.callSettings) {
        const cs = s.callSettings
        if (cs.numberPriority) setNumberPriority(cs.numberPriority)
        if (cs.vorwahl !== undefined) setVorwahl(cs.vorwahl)
        if (cs.callResults) setCallResults(cs.callResults)
        if (cs.script !== undefined) setScript(cs.script)
      }
    }
    load()
  }, [])

  const saveAll = async (overrides = {}) => {
    const data = {
      numberPriority,
      vorwahl,
      callResults,
      script,
      ...overrides,
    }
    await api.setSetting?.('callSettings', data)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const moveItem = (index, direction) => {
    const newList = [...numberPriority]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newList.length) return
    ;[newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]]
    setNumberPriority(newList)
    saveAll({ numberPriority: newList })
  }

  const removeResult = (index) => {
    const next = callResults.filter((_, i) => i !== index)
    setCallResults(next)
    saveAll({ callResults: next })
  }

  const addResult = () => {
    if (!newResult.trim()) return
    const next = [...callResults, newResult.trim()]
    setCallResults(next)
    setNewResult('')
    saveAll({ callResults: next })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <Phone size={20} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Anrufe</h2>
          <p className="text-sm text-gray-500">Einstellungen für Anruf-Sessions</p>
        </div>
      </div>

      <div className="max-w-lg space-y-8">
        {/* NUMMERPRIORITÄT */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nummerpriorität</h3>
          <div className="space-y-2">
            {numberPriority.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}.</span>
                <span className="text-sm font-medium text-gray-800 flex-1">{item}</span>
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === numberPriority.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Welche Nummer wird zuerst angewählt, wenn mehrere hinterlegt sind.</p>
        </div>

        {/* AUTOMATISCHE VORWAHL */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Automatische Vorwahl</h3>
          <input
            type="text"
            value={vorwahl}
            onChange={e => setVorwahl(e.target.value)}
            placeholder="z.B. +49 oder leer lassen"
            className={inputClass}
            onBlur={() => saveAll()}
          />
          <p className="text-xs text-gray-400 mt-1.5">Wird vor jede Nummer gesetzt, falls nicht schon enthalten (z.B. +49 oder 0049).</p>
        </div>

        {/* ANRUF-ERGEBNISSE */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Anruf-Ergebnisse</h3>
          <p className="text-xs text-gray-400 mb-3">Schnellauswahl-Optionen in der Anruf-Session.</p>
          <div className="space-y-2 mb-3">
            {callResults.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group">
                <span className="text-sm text-gray-800 flex-1">{item}</span>
                <button
                  onClick={() => removeResult(i)}
                  className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newResult}
              onChange={e => setNewResult(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addResult()}
              placeholder="Neues Ergebnis..."
              className={inputClass}
            />
            <button
              onClick={addResult}
              disabled={!newResult.trim()}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} /> Hinzufügen
            </button>
          </div>
        </div>

        {/* ANRUF-SKRIPT */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Anruf-Skript</h3>
          <p className="text-xs text-gray-400 mb-3">Dein persönliches Gesprächsskript für Anruf-Sessions.</p>
          <textarea
            value={script}
            onChange={e => setScript(e.target.value)}
            onBlur={() => saveAll()}
            placeholder="Guten Tag, mein Name ist ... Ich rufe an wegen ..."
            rows={5}
            className={inputClass + ' resize-none'}
          />
        </div>

        {saved && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <CheckCircle size={15} /> Gespeichert!
          </div>
        )}
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
    const res = await api.testEmail(config)
    setTesting(false)
    setTestResult(res)
  }

  const handleSave = async () => {
    const res = await api.updateProfile(currentUser.id, {
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
          <Sun size={20} className="text-yellow-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Darstellung</h2>
          <p className="text-sm text-gray-500">Wähle zwischen hellem und dunklem Design.</p>
        </div>
      </div>

      <div className="max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          {/* Hell Card */}
          <button
            onClick={() => onSetDarkMode(false)}
            className={`relative rounded-2xl border-2 p-4 transition-all text-left ${
              !darkMode ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            {/* Radio dot */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              !darkMode ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {!darkMode && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
            {/* Preview mockup */}
            <div className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-white p-3">
              <div className="h-2 w-12 bg-gray-200 rounded mb-2" />
              <div className="h-1.5 w-20 bg-gray-100 rounded mb-3" />
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-gray-100 rounded" />
                <div className="h-1.5 w-3/4 bg-gray-100 rounded" />
                <div className="h-1.5 w-5/6 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun size={14} className="text-yellow-500" />
              <span className={`text-sm font-semibold ${!darkMode ? 'text-blue-700' : 'text-gray-700'}`}>Hell</span>
            </div>
          </button>

          {/* Dunkel Card */}
          <button
            onClick={() => onSetDarkMode(true)}
            className={`relative rounded-2xl border-2 p-4 transition-all text-left ${
              darkMode ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            {/* Radio dot */}
            <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              darkMode ? 'border-blue-500' : 'border-gray-300'
            }`}>
              {darkMode && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
            </div>
            {/* Preview mockup */}
            <div className="mb-3 rounded-xl overflow-hidden border border-gray-700 bg-gray-800 p-3">
              <div className="h-2 w-12 bg-gray-600 rounded mb-2" />
              <div className="h-1.5 w-20 bg-gray-700 rounded mb-3" />
              <div className="space-y-1.5">
                <div className="h-1.5 w-full bg-gray-700 rounded" />
                <div className="h-1.5 w-3/4 bg-gray-700 rounded" />
                <div className="h-1.5 w-5/6 bg-gray-700 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Moon size={14} className="text-gray-400" />
              <span className={`text-sm font-semibold ${darkMode ? 'text-blue-700' : 'text-gray-700'}`}>Dunkel</span>
            </div>
          </button>
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
      const s = await api.getSettings?.()
      if (s?.notifications) setPrefs(p => ({ ...p, ...s.notifications }))
    }
    load()
  }, [])

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    api.setSetting?.('notifications', next)
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

function BackupSection() {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [status, setStatus] = useState(null)
  const importRef = useRef(null)

  const handleCsvExport = async () => {
    setExporting(true)
    setStatus(null)
    try {
      const rows = await api.query?.('SELECT * FROM contacts')
      if (!rows || rows.length === 0) {
        setStatus({ type: 'warn', msg: 'Keine Kontakte zum Exportieren vorhanden.' })
        setExporting(false)
        return
      }
      const headers = Object.keys(rows[0])
      const csvContent = [
        headers.join(';'),
        ...rows.map(row => headers.map(h => {
          let val = row[h] ?? ''
          val = String(val).replace(/"/g, '""')
          return `"${val}"`
        }).join(';'))
      ].join('\n')

      // Use BOM for Excel compatibility
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kontakte_export_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ type: 'success', msg: 'CSV-Export erfolgreich!' })
    } catch (err) {
      console.error('CSV Export error:', err)
      setStatus({ type: 'error', msg: 'Fehler beim Export: ' + err.message })
    }
    setExporting(false)
  }

  const handleCsvImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setStatus(null)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        setStatus({ type: 'warn', msg: 'CSV-Datei ist leer oder enthält nur Header.' })
        setImporting(false)
        return
      }
      const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim())
      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim())
        const row = {}
        headers.forEach((h, idx) => { row[h] = values[idx] || '' })
        if (row.firma || row.name || row.email) {
          const cols = Object.keys(row).filter(k => k !== 'id')
          const vals = cols.map(k => row[k])
          const placeholders = cols.map(() => '?').join(', ')
          await api.query?.(
            `INSERT INTO contacts (${cols.join(', ')}) VALUES (${placeholders})`,
            vals
          )
          imported++
        }
      }
      setStatus({ type: 'success', msg: `${imported} Kontakte importiert!` })
    } catch (err) {
      console.error('CSV Import error:', err)
      setStatus({ type: 'error', msg: 'Fehler beim Import: ' + err.message })
    }
    setImporting(false)
    if (importRef.current) importRef.current.value = ''
  }

  const handleFullBackup = async () => {
    setBackingUp(true)
    setStatus(null)
    try {
      const tables = ['users', 'contacts', 'call_history', 'offers', 'email_campaigns']
      const backup = { timestamp: new Date().toISOString(), tables: {} }
      for (const table of tables) {
        try {
          const rows = await api.query?.(`SELECT * FROM ${table}`)
          backup.tables[table] = rows || []
        } catch {
          backup.tables[table] = []
        }
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ type: 'success', msg: 'Vollständiges Backup erstellt!' })
    } catch (err) {
      console.error('Backup error:', err)
      setStatus({ type: 'error', msg: 'Fehler beim Backup: ' + err.message })
    }
    setBackingUp(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <HardDrive size={20} className="text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Backup & Daten</h2>
          <p className="text-sm text-gray-500">Daten sichern, exportieren und importieren.</p>
        </div>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Kontakte CSV */}
        <div className="p-5 bg-gray-50 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">Kontakte CSV</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">Kontakte als Excel-kompatible CSV-Datei exportieren oder importieren</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCsvExport}
                  disabled={exporting}
                  className="px-4 py-2 text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 rounded-xl transition-colors"
                >
                  {exporting ? 'Exportieren...' : 'Exportieren'}
                </button>
                <button
                  onClick={() => importRef.current?.click()}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-bold bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-xl transition-colors"
                >
                  {importing ? 'Importieren...' : 'Importieren'}
                </button>
                <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              </div>
            </div>
          </div>
        </div>

        {/* Vollständiges Backup */}
        <div className="p-5 bg-gray-50 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Database size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">Vollständiges Backup</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">Alle Kontakte, Anrufe, Angebote, Mitarbeiter und mehr als JSON</p>
              <button
                onClick={handleFullBackup}
                disabled={backingUp}
                className="px-4 py-2 text-sm font-bold bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors"
              >
                {backingUp ? 'Erstelle Backup...' : 'Backup jetzt erstellen'}
              </button>
            </div>
          </div>
        </div>

        {/* Tipp */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <p className="text-xs text-amber-800 font-medium">
            <span className="font-bold">Tipp:</span> Erstelle regelmäßig Backups und speichere sie an einem sicheren Ort (z.B. Cloud-Laufwerk).
          </p>
        </div>

        {/* Status */}
        {status && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            status.type === 'success' ? 'bg-green-50 text-green-700' :
            status.type === 'error' ? 'bg-red-50 text-red-600' :
            'bg-amber-50 text-amber-700'
          }`}>
            {status.type === 'success' ? <CheckCircle size={16} /> : status.type === 'error' ? <XCircle size={16} /> : null}
            {status.msg}
          </div>
        )}
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'profile', label: 'Mein Profil', icon: User, dot: 'green' },
  { id: 'company', label: 'Firmenprofil', icon: Building2 },
  { id: 'email', label: 'E-Mail Konto', icon: Mail, dotKey: 'email' },
  { id: 'calls', label: 'Anrufe', icon: Phone },
  { id: 'appearance', label: 'Darstellung', icon: Sun },
  { id: 'language', label: 'Sprache', icon: Globe },
  { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
  { id: 'backup', label: 'Backup & Daten', icon: HardDrive },
]

export default function Settings({ currentUser, onProfileUpdated, onLogout, darkMode, onSetDarkMode, language, onSetLanguage }) {
  const [activeSection, setActiveSection] = useState('profile')

  const emailConfigured = !!(currentUser?.email_config?.email && currentUser?.email_config?.password)

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-gray-50">
      {/* Linke Nav — horizontal tabs on mobile, vertical sidebar on desktop */}
      <div className="md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex md:flex-col flex-shrink-0 md:pt-8">
        <div className="hidden md:block px-5 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Einstellungen</h2>
        </div>
        <nav className="flex md:flex-col md:px-3 md:space-y-1 md:flex-1 overflow-x-auto px-2 py-1 md:py-0 gap-1 md:gap-0">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const showGreenDot = item.dot === 'green'
            const showRedDot = item.dotKey === 'email' && !emailConfigured
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`whitespace-nowrap text-left px-3 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 md:gap-3 ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} className={activeSection === item.id ? 'text-blue-500' : 'text-gray-400'} />
                <span className="hidden sm:inline flex-1">{item.label}</span>
                {showGreenDot && (
                  <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                )}
                {showRedDot && (
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </nav>
        <div className="hidden md:block px-3 pb-6">
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-12">
        {activeSection === 'profile' && (
          <ProfileSection currentUser={currentUser} onProfileUpdated={onProfileUpdated} />
        )}
        {activeSection === 'company' && (
          <CompanySection />
        )}
        {activeSection === 'email' && (
          <EmailSection currentUser={currentUser} onProfileUpdated={onProfileUpdated} />
        )}
        {activeSection === 'calls' && (
          <CallsSection />
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
        {activeSection === 'backup' && (
          <BackupSection />
        )}
      </div>
    </div>
  )
}
