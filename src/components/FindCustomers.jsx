import { api } from '../api'
import { useState, useEffect } from 'react'
import { Search, X, Plus, Check, ChevronDown, ChevronUp, Trash2, Tag } from 'lucide-react'

// Große Liste gängiger Branchen mit OSM-Tags
const ALL_CATEGORIES = [
  // Pflege & Gesundheit
  { id: 'hospital', label: 'Krankenhäuser', group: 'Gesundheit', tags: [['amenity', 'hospital'], ['healthcare', 'hospital']] },
  { id: 'nursing_home', label: 'Altenpflegeheime', group: 'Gesundheit', tags: [['social_facility', 'nursing_home'], ['amenity', 'nursing_home']] },
  { id: 'assisted_living', label: 'Betreutes Wohnen', group: 'Gesundheit', tags: [['social_facility', 'assisted_living']] },
  { id: 'ambulatory_care', label: 'Ambulante Pflege', group: 'Gesundheit', tags: [['social_facility', 'ambulatory_care'], ['healthcare', 'home_care']] },
  { id: 'rehabilitation', label: 'Reha-Kliniken', group: 'Gesundheit', tags: [['healthcare', 'rehabilitation']] },
  { id: 'doctors', label: 'Arztpraxen', group: 'Gesundheit', tags: [['amenity', 'doctors']] },
  { id: 'dentist', label: 'Zahnarztpraxen', group: 'Gesundheit', tags: [['amenity', 'dentist']] },
  { id: 'pharmacy', label: 'Apotheken', group: 'Gesundheit', tags: [['amenity', 'pharmacy']] },
  { id: 'veterinary', label: 'Tierarztpraxen', group: 'Gesundheit', tags: [['amenity', 'veterinary']] },
  { id: 'clinic', label: 'Kliniken', group: 'Gesundheit', tags: [['amenity', 'clinic']] },
  // Gastronomie & Hotellerie
  { id: 'restaurant', label: 'Restaurants', group: 'Gastronomie', tags: [['amenity', 'restaurant']] },
  { id: 'cafe', label: 'Cafés', group: 'Gastronomie', tags: [['amenity', 'cafe']] },
  { id: 'bar', label: 'Bars & Kneipen', group: 'Gastronomie', tags: [['amenity', 'bar'], ['amenity', 'pub']] },
  { id: 'fast_food', label: 'Fast Food', group: 'Gastronomie', tags: [['amenity', 'fast_food']] },
  { id: 'hotel', label: 'Hotels', group: 'Gastronomie', tags: [['tourism', 'hotel']] },
  { id: 'guest_house', label: 'Pensionen', group: 'Gastronomie', tags: [['tourism', 'guest_house']] },
  // Handwerk & Bau
  { id: 'car_repair', label: 'Autowerkstätten', group: 'Handwerk', tags: [['shop', 'car_repair']] },
  { id: 'electrician', label: 'Elektriker', group: 'Handwerk', tags: [['craft', 'electrician']] },
  { id: 'plumber', label: 'Klempner / Sanitär', group: 'Handwerk', tags: [['craft', 'plumber']] },
  { id: 'carpenter', label: 'Tischlereien', group: 'Handwerk', tags: [['craft', 'carpenter']] },
  { id: 'painter', label: 'Malerbetriebe', group: 'Handwerk', tags: [['craft', 'painter']] },
  { id: 'roofer', label: 'Dachdecker', group: 'Handwerk', tags: [['craft', 'roofer']] },
  { id: 'hvac', label: 'Heizung / Klima', group: 'Handwerk', tags: [['craft', 'hvac']] },
  { id: 'metal', label: 'Metallbau / Schlosserei', group: 'Handwerk', tags: [['craft', 'metal_construction']] },
  // Einzelhandel
  { id: 'supermarket', label: 'Supermärkte', group: 'Einzelhandel', tags: [['shop', 'supermarket']] },
  { id: 'bakery', label: 'Bäckereien', group: 'Einzelhandel', tags: [['shop', 'bakery']] },
  { id: 'butcher', label: 'Metzgereien', group: 'Einzelhandel', tags: [['shop', 'butcher']] },
  { id: 'clothes', label: 'Bekleidungsgeschäfte', group: 'Einzelhandel', tags: [['shop', 'clothes']] },
  { id: 'furniture', label: 'Möbelhäuser', group: 'Einzelhandel', tags: [['shop', 'furniture']] },
  { id: 'electronics', label: 'Elektronikfachgeschäfte', group: 'Einzelhandel', tags: [['shop', 'electronics']] },
  { id: 'hairdresser', label: 'Friseursalons', group: 'Einzelhandel', tags: [['shop', 'hairdresser']] },
  { id: 'florist', label: 'Blumenläden', group: 'Einzelhandel', tags: [['shop', 'florist']] },
  { id: 'optician', label: 'Optiker', group: 'Einzelhandel', tags: [['shop', 'optician']] },
  // Bildung
  { id: 'school', label: 'Schulen', group: 'Bildung', tags: [['amenity', 'school']] },
  { id: 'kindergarten', label: 'Kindergärten / Kitas', group: 'Bildung', tags: [['amenity', 'kindergarten']] },
  { id: 'university', label: 'Universitäten / Hochschulen', group: 'Bildung', tags: [['amenity', 'university'], ['amenity', 'college']] },
  { id: 'driving_school', label: 'Fahrschulen', group: 'Bildung', tags: [['amenity', 'driving_school']] },
  // Dienstleistung & Büro
  { id: 'bank', label: 'Banken', group: 'Dienstleistung', tags: [['amenity', 'bank']] },
  { id: 'insurance', label: 'Versicherungen', group: 'Dienstleistung', tags: [['office', 'insurance']] },
  { id: 'estate_agent', label: 'Immobilienmakler', group: 'Dienstleistung', tags: [['office', 'estate_agent']] },
  { id: 'lawyer', label: 'Rechtsanwälte', group: 'Dienstleistung', tags: [['office', 'lawyer']] },
  { id: 'accountant', label: 'Steuerberater', group: 'Dienstleistung', tags: [['office', 'accountant']] },
  { id: 'it', label: 'IT-Unternehmen', group: 'Dienstleistung', tags: [['office', 'it']] },
  { id: 'company', label: 'Firmenbüros', group: 'Dienstleistung', tags: [['office', 'company']] },
  // Freizeit & Sport
  { id: 'fitness', label: 'Fitnessstudios', group: 'Freizeit', tags: [['leisure', 'fitness_centre']] },
  { id: 'sports_centre', label: 'Sportzentren', group: 'Freizeit', tags: [['leisure', 'sports_centre']] },
  { id: 'swimming', label: 'Schwimmbäder', group: 'Freizeit', tags: [['leisure', 'swimming_pool'], ['amenity', 'swimming_pool']] },
  // Industrie & Logistik
  { id: 'industrial', label: 'Industriebetriebe', group: 'Industrie', tags: [['landuse', 'industrial']] },
  { id: 'warehouse', label: 'Lagerhäuser', group: 'Industrie', tags: [['building', 'warehouse']] },
]

const GROUP_COLORS = {
  'Gesundheit': 'bg-red-100 text-red-700',
  'Gastronomie': 'bg-orange-100 text-orange-700',
  'Handwerk': 'bg-amber-100 text-amber-700',
  'Einzelhandel': 'bg-blue-100 text-blue-700',
  'Bildung': 'bg-indigo-100 text-indigo-700',
  'Dienstleistung': 'bg-purple-100 text-purple-700',
  'Freizeit': 'bg-green-100 text-green-700',
  'Industrie': 'bg-gray-200 text-gray-700',
}

function buildOverpassQuery(lat, lon, selectedCategories) {
  const radius = 50000
  const conditions = []
  for (const cat of selectedCategories) {
    for (const [key, value] of cat.tags) {
      conditions.push(`node["${key}"="${value}"](around:${radius},${lat},${lon});`)
      conditions.push(`way["${key}"="${value}"](around:${radius},${lat},${lon});`)
    }
  }
  return `[out:json][timeout:30];(${conditions.join('')});out center tags;`
}

function parseResults(elements, selectedCategories) {
  const seen = new Set()
  // Build reverse lookup: tag value → category label
  const tagToLabel = {}
  for (const cat of selectedCategories) {
    for (const [key, value] of cat.tags) {
      tagToLabel[`${key}=${value}`] = cat.label
    }
  }
  return elements
    .filter(el => el.tags?.name)
    .map(el => {
      const t = el.tags
      // Find matching category
      let typeLabel = ''
      for (const [tagKey, tagVal] of Object.entries(t)) {
        const lookup = `${tagKey}=${tagVal}`
        if (tagToLabel[lookup]) { typeLabel = tagToLabel[lookup]; break }
      }
      if (!typeLabel) typeLabel = 'Sonstige'
      const street = t['addr:street'] || ''
      const housenumber = t['addr:housenumber'] || ''
      const postcode = t['addr:postcode'] || ''
      const city = t['addr:city'] || ''
      const address = street + (housenumber ? ' ' + housenumber : '')
      const key = t.name + address
      if (seen.has(key)) return null
      seen.add(key)
      return {
        name: t.name, typeLabel, address, postal_code: postcode, city,
        phone: t.phone || t['contact:phone'] || '',
        website: t.website || t['contact:website'] || '',
        email: t.email || t['contact:email'] || '',
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default function FindCustomers({ userId, userLat, userLon, onAddContact, onClose }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [added, setAdded] = useState(new Set())
  const [selectedCats, setSelectedCats] = useState([])
  const [showCatPicker, setShowCatPicker] = useState(true)
  const [catSearch, setCatSearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState(new Set())

  // Gespeicherte Kategorien laden
  useEffect(() => {
    async function load() {
      const s = await api.getSettings?.()
      if (s?.findCustomersCats) {
        const savedIds = s.findCustomersCats
        const cats = ALL_CATEGORIES.filter(c => savedIds.includes(c.id))
        if (cats.length > 0) setSelectedCats(cats)
      }
    }
    load()
  }, [])

  // Kategorien speichern wenn sie sich ändern
  const saveSelectedCats = (cats) => {
    setSelectedCats(cats)
    api.setSetting?.('findCustomersCats', cats.map(c => c.id))
  }

  const toggleCat = (cat) => {
    const exists = selectedCats.some(c => c.id === cat.id)
    if (exists) {
      saveSelectedCats(selectedCats.filter(c => c.id !== cat.id))
    } else {
      saveSelectedCats([...selectedCats, cat])
    }
  }

  const toggleGroup = (group) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const handleSearch = async () => {
    if (selectedCats.length === 0) return
    setLoading(true)
    setError('')
    setResults([])
    setShowCatPicker(false)
    try {
      const query = buildOverpassQuery(userLat || 52.3759, userLon || 9.7320, selectedCats)
      const [data, existing] = await Promise.all([
        api.overpass(query),
        api.query('SELECT company_name, address FROM contacts WHERE user_id=$1', [userId]),
      ])
      const existingKeys = new Set(
        (existing.rows || []).map(c => (c.company_name || '') + (c.address || ''))
      )
      setAdded(existingKeys)
      const parsed = parseResults(data.elements || [], selectedCats)
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
    await api.query(
      `INSERT INTO contacts (user_id, company_name, address, city, postal_code, phone_central, email, website, industry, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1) ON CONFLICT DO NOTHING RETURNING id`,
      [userId, r.name, r.address, r.city, r.postal_code, r.phone, r.email, r.website, r.typeLabel || null]
    )
    setAdded(prev => new Set([...prev, r.name + r.address]))
    onAddContact()
  }

  const filtered = results.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q)
    const matchType = !filterType || r.typeLabel === filterType
    return matchSearch && matchType
  })

  const types = [...new Set(results.map(r => r.typeLabel))]

  // Kategorien nach Gruppen gruppieren und filtern
  const groups = {}
  ALL_CATEGORIES.forEach(cat => {
    if (catSearch) {
      const q = catSearch.toLowerCase()
      if (!cat.label.toLowerCase().includes(q) && !cat.group.toLowerCase().includes(q)) return
    }
    if (!groups[cat.group]) groups[cat.group] = []
    groups[cat.group].push(cat)
  })

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col" style={{ height: '85vh' }}>

        {/* Header */}
        <div className="px-4 sm:px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Kunden finden</h3>
            <p className="text-xs text-gray-400 mt-0.5">{userLat && userLon ? 'Dein Standort' : 'Hannover'} & Umgebung (50 km)</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Ausgewählte Kategorien + Steuerung */}
        <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Ausgewählte Branchen ({selectedCats.length})
            </p>
            <button
              onClick={() => setShowCatPicker(!showCatPicker)}
              className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              <Tag size={12} />
              {showCatPicker ? 'Ausblenden' : 'Branchen wählen'}
            </button>
          </div>
          {selectedCats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedCats.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${GROUP_COLORS[cat.group] || 'bg-gray-100 text-gray-600'}`}
                >
                  {cat.label}
                  <X size={11} className="opacity-60" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">Wähle mindestens eine Branche aus</p>
          )}
          <button
            onClick={handleSearch}
            disabled={loading || selectedCats.length === 0}
            className="w-full py-3 text-sm font-semibold bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
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

        {/* Kategorie-Picker */}
        {showCatPicker && results.length === 0 && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
            <input
              type="text"
              placeholder="Branche suchen..."
              value={catSearch}
              onChange={e => setCatSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="space-y-2">
              {Object.entries(groups).map(([group, cats]) => (
                <div key={group}>
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-700">{group}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{cats.filter(c => selectedCats.some(s => s.id === c.id)).length}/{cats.length}</span>
                      {expandedGroups.has(group) ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </button>
                  {(expandedGroups.has(group) || catSearch) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-1.5 pl-1">
                      {cats.map(cat => {
                        const isActive = selectedCats.some(c => c.id === cat.id)
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCat(cat)}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition-all border-2 ${
                              isActive
                                ? 'border-blue-400 bg-blue-50 text-blue-700'
                                : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{cat.label}</span>
                              {isActive && <Check size={12} className="text-blue-500 flex-shrink-0" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        {results.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-b border-gray-100 flex gap-2 sm:gap-3 flex-shrink-0">
            <input
              type="text"
              placeholder="Name oder Stadt..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle</option>
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="text-xs text-gray-400 self-center whitespace-nowrap hidden sm:inline">{filtered.length} Ergebnisse</span>
          </div>
        )}

        {/* Liste */}
        {(results.length > 0 || loading || error) && (
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3">
            {error && <div className="py-8 text-center text-sm text-red-500">{error}</div>}
            <div className="space-y-2">
              {filtered.map((r, i) => {
                const isAdded = added.has(r.name + r.address)
                return (
                  <div key={i} className="flex items-start justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-200 text-gray-600">
                          {r.typeLabel}
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
                      {isAdded ? <><Check size={13} /> <span className="hidden sm:inline">Hinzugefügt</span></> : <><Plus size={13} /> <span className="hidden sm:inline">Kontakt</span></>}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Leerer Zustand wenn kein Picker und keine Ergebnisse */}
        {!showCatPicker && results.length === 0 && !loading && !error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Search size={48} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium">Wähle Branchen und starte die Suche</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
