import { useState } from 'react'
import { Search, X, Hospital, Home, Ambulance, Activity, Building2, Plus, Check } from 'lucide-react'

const CATEGORIES = [
  { label: 'Krankenhäuser', icon: Hospital, tags: [['amenity', 'hospital'], ['healthcare', 'hospital']] },
  { label: 'Altenpflegeheime', icon: Home, tags: [['social_facility', 'nursing_home'], ['amenity', 'nursing_home']] },
  { label: 'Pflegeheime', icon: Building2, tags: [['social_facility', 'assisted_living']] },
  { label: 'Ambulante Pflege', icon: Ambulance, tags: [['social_facility', 'ambulatory_care'], ['healthcare', 'home_care']] },
  { label: 'Reha Kliniken', icon: Activity, tags: [['healthcare', 'rehabilitation']] },
]

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

function buildOverpassQuery(lat, lon) {
  const radius = 50000
  const conditions = [
    `node["amenity"="hospital"](around:${radius},${lat},${lon});`,
    `way["amenity"="hospital"](around:${radius},${lat},${lon});`,
    `node["healthcare"="hospital"](around:${radius},${lat},${lon});`,
    `way["healthcare"="hospital"](around:${radius},${lat},${lon});`,
    `node["social_facility"="nursing_home"](around:${radius},${lat},${lon});`,
    `way["social_facility"="nursing_home"](around:${radius},${lat},${lon});`,
    `node["amenity"="nursing_home"](around:${radius},${lat},${lon});`,
    `way["amenity"="nursing_home"](around:${radius},${lat},${lon});`,
    `node["social_facility"="assisted_living"](around:${radius},${lat},${lon});`,
    `way["social_facility"="assisted_living"](around:${radius},${lat},${lon});`,
    `node["social_facility"="ambulatory_care"](around:${radius},${lat},${lon});`,
    `way["social_facility"="ambulatory_care"](around:${radius},${lat},${lon});`,
    `node["healthcare"="rehabilitation"](around:${radius},${lat},${lon});`,
    `way["healthcare"="rehabilitation"](around:${radius},${lat},${lon});`,
  ]
  return `[out:json][timeout:30];(${conditions.join('')});out center tags;`
}

function parseResults(elements) {
  const seen = new Set()
  return elements
    .filter(el => el.tags?.name)
    .map(el => {
      const t = el.tags
      const type =
        t['social_facility'] || t['healthcare'] ||
        (t['amenity'] === 'hospital' ? 'hospital' : null) ||
        (t['amenity'] === 'nursing_home' ? 'nursing_home' : null) || 'hospital'
      const street = t['addr:street'] || ''
      const housenumber = t['addr:housenumber'] || ''
      const postcode = t['addr:postcode'] || ''
      const city = t['addr:city'] || ''
      const address = street + (housenumber ? ' ' + housenumber : '')
      const key = t.name + address
      if (seen.has(key)) return null
      seen.add(key)
      return {
        name: t.name, type, address, postal_code: postcode, city,
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || '',
        email: t.email || t['contact:email'] || '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aHan = a.city.toLowerCase().includes('hannover')
      const bHan = b.city.toLowerCase().includes('hannover')
      if (aHan && !bHan) return -1
      if (!aHan && bHan) return 1
      return a.name.localeCompare(b.name)
    })
}

export default function FindCustomers({ userId, userLat, userLon, onAddContact, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [added, setAdded] = useState(new Set())

  const handleSearch = async () => {
    setLoading(true)
    setError('')
    setResults([])
    try {
      const query = buildOverpassQuery(userLat || 52.3759, userLon || 9.7320)
      const data = await window.electronAPI.overpass(query)
      const parsed = parseResults(data.elements || [])
      setResults(parsed)
      if (parsed.length === 0) setError('Keine Ergebnisse gefunden.')
    } catch (e) {
      const msg = e.message || ''
      const clean = msg.includes(': Error: ') ? msg.split(': Error: ').pop() : msg
      setError(clean || 'Fehler beim Laden der Daten.')
    }
    setLoading(false)
  }

  const handleAdd = async (r) => {
    await window.electronAPI.query(
      `INSERT INTO contacts (user_id, company_name, address, city, postal_code, phone_central, email, website, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1) ON CONFLICT DO NOTHING RETURNING id`,
      [userId, r.name, r.address, r.city, r.postal_code, r.phone, r.email, r.website]
    )
    setAdded(prev => new Set([...prev, r.name + r.address]))
    onAddContact()
  }

  const filtered = results.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)
    const matchType = !filterType || r.type === filterType
    return matchSearch && matchType
  })

  const types = [...new Set(results.map(r => r.type))]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col" style={{ height: '85vh' }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kunden finden</h3>
            <p className="text-xs text-gray-400 mt-0.5">{userLat && userLon ? 'Dein Standort' : 'Hannover'} & Umgebung (50 km) — Krankenhäuser, Pflegeheime, Reha</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Kategorien */}
        <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <div key={cat.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                  <Icon size={13} />
                  {cat.label}
                </div>
              )
            })}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-3 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Suche läuft...
              </>
            ) : (
              <>
                <Search size={15} />
                Potenzielle Kunden suchen
              </>
            )}
          </button>
        </div>

        {/* Filter */}
        {results.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 flex gap-3 flex-shrink-0">
            <input
              type="text"
              placeholder="Name oder Stadt suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Typen</option>
              {types.map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t] || t}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 self-center whitespace-nowrap">{filtered.length} Ergebnisse</span>
          </div>
        )}

        {/* Liste */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {error && <div className="py-8 text-center text-sm text-red-500">{error}</div>}
          {!loading && results.length === 0 && !error && (
            <div className="py-16 text-center text-gray-400">
              <Hospital size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Klick auf "Potenzielle Kunden suchen" um zu starten</p>
            </div>
          )}
          <div className="space-y-2">
            {filtered.map((r, i) => {
              const isAdded = added.has(r.name + r.address)
              return (
                <div key={i} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[r.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABEL[r.type] || r.type}
                      </span>
                    </div>
                    {(r.address || r.city) && (
                      <p className="text-xs text-gray-500">
                        {[r.address, r.postal_code, r.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div className="flex gap-3 mt-1">
                      {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                      {r.website && <p className="text-xs text-blue-400 truncate max-w-xs">{r.website}</p>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(r)}
                    disabled={isAdded}
                    className={`flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
                      isAdded
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isAdded ? <><Check size={13} /> Hinzugefügt</> : <><Plus size={13} /> Kontakt</>}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
