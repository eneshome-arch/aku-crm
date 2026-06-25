import { useState, useEffect, useRef } from 'react'
import { Download, CheckCircle, XCircle } from 'lucide-react'

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

const EMPTY_FORM = {
  company_name: '',
  industry: '',
  company_size: '',
  address: '',
  city: '',
  postal_code: '',
  website: '',
  first_name: '',
  last_name: '',
  position: '',
  phone_central: '',
  phone_direct: '',
  mobile: '',
  email: '',
  status: 1,
  next_followup: '',
  followup_note: '',
  revenue_potential: '',
  contract_notes: '',
}

function FormField({ label, required, children }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
    />
  )
}

function SectionHeader({ title }) {
  return (
    <div className="col-span-2 mt-2 mb-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">{title}</p>
    </div>
  )
}

// Adress-Autocomplete Komponente via Photon API (OpenStreetMap, kostenlos)
function AddressAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleChange = (val) => {
    onChange(val)
    clearTimeout(debounceRef.current)
    if (val.length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&lang=de&limit=6&layer=street&layer=house&lat=52.3759&lon=9.7320`
        )
        const data = await res.json()
        const results = (data.features || [])
          .filter(f => f.properties.country === 'Deutschland' || f.properties.country === 'Austria' || f.properties.country === 'Switzerland')
          .map(f => {
            const p = f.properties
            const street = p.street || p.name || ''
            const housenumber = p.housenumber || ''
            const postcode = p.postcode || ''
            const city = p.city || p.town || p.village || p.county || ''
            return {
              label: [street + (housenumber ? ' ' + housenumber : ''), postcode, city].filter(Boolean).join(', '),
              address: street + (housenumber ? ' ' + housenumber : ''),
              postal_code: postcode,
              city,
            }
          })
          .filter(r => r.address)
        setSuggestions(results)
        setOpen(results.length > 0)
      } catch (e) {
        setSuggestions([])
      }
      setLoading(false)
    }, 300)
  }

  const handleSelect = (suggestion) => {
    onChange(suggestion.address)
    onSelect(suggestion)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="Musterstraße 1"
          className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-blue-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <span className="font-medium">{s.address}</span>
              {(s.postal_code || s.city) && (
                <span className="text-gray-400 ml-1">{[s.postal_code, s.city].filter(Boolean).join(' ')}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ContactForm({ userId, onSaved, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState('')

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }))

  const handleExtract = async () => {
    if (!urlInput.trim()) return
    setExtracting(true)
    setExtractMsg('')
    const res = await window.electronAPI.extract(urlInput.trim())
    setExtracting(false)
    if (!res.success) {
      setExtractMsg('Fehler: ' + res.error)
      return
    }
    const d = res.data
    setForm(f => ({
      ...f,
      company_name: d.company_name || f.company_name,
      address: d.address || f.address,
      city: d.city || f.city,
      postal_code: d.postal_code || f.postal_code,
      phone_central: d.phone_central || f.phone_central,
      email: d.email || f.email,
      website: d.website || f.website,
    }))
    setExtractMsg('Daten erfolgreich geladen!')
  }

  const handleAddressSelect = (suggestion) => {
    setForm(f => ({
      ...f,
      address: suggestion.address,
      postal_code: suggestion.postal_code || f.postal_code,
      city: suggestion.city || f.city,
    }))
  }

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      setError('Firmenname ist erforderlich.')
      return
    }
    setSaving(true)
    const res = await window.electronAPI.query(
      `INSERT INTO contacts (
        user_id, company_name, industry, company_size, address, city, postal_code, website,
        first_name, last_name, position, phone_central, phone_direct, mobile, email,
        status, next_followup, followup_note, revenue_potential, contract_notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING id`,
      [
        userId, form.company_name, form.industry, form.company_size, form.address, form.city, form.postal_code, form.website,
        form.first_name, form.last_name, form.position, form.phone_central, form.phone_direct, form.mobile, form.email,
        form.status, form.next_followup || null, form.followup_note, form.revenue_potential || null, form.contract_notes
      ]
    )
    setSaving(false)
    if (res.error) {
      setError(res.error)
      return
    }
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">Neuer Kontakt</h3>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* URL Extraktion */}
          <div className="mb-5 p-4 bg-blue-50 rounded-2xl">
            <p className="text-xs font-semibold text-blue-700 mb-2">Daten automatisch laden</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleExtract()}
                placeholder="Google Maps oder Website URL einfügen..."
                className="flex-1 px-3 py-2 bg-white rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-100"
              />
              <button
                type="button"
                onClick={handleExtract}
                disabled={extracting || !urlInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors flex-shrink-0 flex items-center gap-1.5"
              >
                {extracting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : <><Download size={14} /> Laden</>}
              </button>
            </div>
            {extractMsg && (
              <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${extractMsg.startsWith('Fehler') ? 'text-red-500' : 'text-green-600'}`}>
                {extractMsg.startsWith('Fehler')
                  ? <XCircle size={12} />
                  : <CheckCircle size={12} />}
                {extractMsg}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-x-4">
            <SectionHeader title="Firmendaten" />
            <FormField label="Firmenname" required>
              <Input value={form.company_name} onChange={set('company_name')} placeholder="Muster GmbH" />
            </FormField>
            <FormField label="Branche">
              <Input value={form.industry} onChange={set('industry')} placeholder="z.B. Produktion" />
            </FormField>
            <FormField label="Firmengröße">
              <Input value={form.company_size} onChange={set('company_size')} placeholder="z.B. 50-200 Mitarbeiter" />
            </FormField>

            {/* Adresse mit Autocomplete - volle Breite */}
            <div className="col-span-2 mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Adresse</label>
              <AddressAutocomplete
                value={form.address}
                onChange={set('address')}
                onSelect={handleAddressSelect}
              />
            </div>

            <FormField label="Stadt">
              <Input value={form.city} onChange={set('city')} placeholder="München" />
            </FormField>
            <FormField label="PLZ">
              <Input value={form.postal_code} onChange={set('postal_code')} placeholder="80333" />
            </FormField>
            <FormField label="Website">
              <Input value={form.website} onChange={set('website')} placeholder="https://..." />
            </FormField>

            <SectionHeader title="Ansprechpartner" />
            <FormField label="Vorname">
              <Input value={form.first_name} onChange={set('first_name')} placeholder="Max" />
            </FormField>
            <FormField label="Nachname">
              <Input value={form.last_name} onChange={set('last_name')} placeholder="Mustermann" />
            </FormField>
            <FormField label="Position / Titel">
              <Input value={form.position} onChange={set('position')} placeholder="Geschäftsführer" />
            </FormField>
            <FormField label="E-Mail">
              <Input value={form.email} onChange={set('email')} type="email" placeholder="max@muster.de" />
            </FormField>
            <FormField label="Telefon Zentrale">
              <Input value={form.phone_central} onChange={set('phone_central')} type="tel" placeholder="+49 89 123456" />
            </FormField>
            <FormField label="Telefon Direkt">
              <Input value={form.phone_direct} onChange={set('phone_direct')} type="tel" />
            </FormField>
            <FormField label="Mobil">
              <Input value={form.mobile} onChange={set('mobile')} type="tel" />
            </FormField>

            <SectionHeader title="Akquise-Status" />
            <FormField label="Status">
              <select
                value={form.status}
                onChange={e => set('status')(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{k}. {v}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Nächstes Followup">
              <Input value={form.next_followup} onChange={set('next_followup')} type="datetime-local" />
            </FormField>
            <div className="col-span-2 mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Erinnerungsnotiz</label>
              <textarea
                rows={2}
                value={form.followup_note}
                onChange={e => set('followup_note')(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            <SectionHeader title="Rahmenvertrag" />
            <FormField label="Umsatzpotenzial (€)">
              <Input value={form.revenue_potential} onChange={set('revenue_potential')} type="number" placeholder="50000" />
            </FormField>
            <div className="col-span-2 mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Notizen zur Chance</label>
              <textarea
                rows={3}
                value={form.contract_notes}
                onChange={e => set('contract_notes')(e.target.value)}
                className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors"
          >
            {saving ? 'Speichern...' : 'Kontakt anlegen'}
          </button>
        </div>
      </div>
    </div>
  )
}
