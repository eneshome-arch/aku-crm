import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Search, Plus, ChevronLeft, Calendar, Coins,
  FileCheck, Filter
} from 'lucide-react'
import AngeboteModule from './AngeboteModule'
import RahmenvertragModule from './RahmenvertragModule'

const STATUS_LABELS = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-600' },
  verschickt: { label: 'Verschickt', color: 'bg-blue-100 text-blue-700' },
  angenommen: { label: 'Angenommen', color: 'bg-green-100 text-green-700' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700' },
}

const DOC_TYPES = {
  angebot:              { label: 'Angebote',              badge: 'ANG', badgeColor: 'bg-blue-100 text-blue-700',   icon: FileText },
  rahmenvertrag:        { label: 'Rahmenverträge',        badge: 'RV',  badgeColor: 'bg-purple-100 text-purple-700', icon: FileCheck },
}

const NAV_ITEMS = [
  { key: 'alle',                 label: 'Alle Belege',              icon: Filter },
  { key: 'angebot',              label: 'Angebote',                 icon: FileText },
  { key: 'rahmenvertrag',        label: 'Rahmenverträge',           icon: FileCheck },
]

function formatDateDE(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(val) {
  const num = Number(val) || 0
  return num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' \u20AC'
}

export default function BelegeModule({ currentUser }) {
  const [offers, setOffers] = useState([])
  const [activeFilter, setActiveFilter] = useState('alle')
  const [search, setSearch] = useState('')
  const [editingOffer, setEditingOffer] = useState(null) // null = list view, object = editor

  const loadOffers = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await window.electronAPI.offersList(currentUser.id)
    if (res.success) setOffers(res.offers)
  }, [currentUser])

  useEffect(() => {
    loadOffers()
  }, [loadOffers])

  // Filter by doc_type
  const filteredByType = activeFilter === 'alle'
    ? offers
    : offers.filter(o => (o.doc_type || 'angebot') === activeFilter)

  // Filter by search
  const filteredOffers = filteredByType.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (o.title || '').toLowerCase().includes(q) ||
      (o.offer_number || '').toLowerCase().includes(q) ||
      (o.company_name || '').toLowerCase().includes(q)
    )
  })

  // Counts per type
  const counts = { alle: offers.length }
  NAV_ITEMS.forEach(item => {
    if (item.key !== 'alle') {
      counts[item.key] = offers.filter(o => (o.doc_type || 'angebot') === item.key).length
    }
  })

  // Finance stats
  const angeboteVerschickt = offers
    .filter(o => (o.doc_type || 'angebot') === 'angebot' && o.status === 'verschickt')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  const angeboteAngenommen = offers
    .filter(o => (o.doc_type || 'angebot') === 'angebot' && o.status === 'angenommen')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0)

  // When editing, show the appropriate editor with a back button
  if (editingOffer !== null) {
    const editDocType = editingOffer?.docType || 'angebot'
    const editId = editingOffer?.id || null
    const editorLabel = editDocType === 'rahmenvertrag' ? 'Rahmenverträge' : 'Angebote'
    return (
      <div className="h-full flex flex-col bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => { setEditingOffer(null); loadOffers() }}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={16} />
            Zurück zu {editorLabel}
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {editDocType === 'rahmenvertrag'
            ? <RahmenvertragModule currentUser={currentUser} />
            : <AngeboteModule currentUser={currentUser} initialOfferId={editId} docType={editDocType} />
          }
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Left sub-navigation */}
      <div className="w-48 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="px-4 pt-6 pb-4">
          <h2 className="text-sm font-bold text-gray-900">Belege</h2>
          <p className="text-xs text-gray-400 mt-0.5">{offers.length} Belege gesamt</p>
        </div>
        <nav className="px-2 flex-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = activeFilter === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2.5 mb-0.5 ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                <span className="flex-1 truncate">{item.label}</span>
                <span className={`text-xs font-semibold rounded-full px-1.5 py-0.5 min-w-[20px] text-center ${
                  active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[item.key] || 0}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Finance section */}
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center gap-1.5 mb-3">
              <Coins size={13} className="text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Finanzen</span>
            </div>
            <div className="space-y-2">
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-600 font-medium">Offene Angebote</p>
                <p className="text-sm font-bold text-blue-700 mt-0.5">{formatCurrency(angeboteVerschickt)}</p>
              </div>
              <div className="bg-green-50 rounded-lg px-3 py-2">
                <p className="text-xs text-green-600 font-medium">Angebote angenommen</p>
                <p className="text-sm font-bold text-green-700 mt-0.5">{formatCurrency(angeboteAngenommen)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Belege</h2>
              <p className="text-sm text-gray-500 mt-0.5">{filteredOffers.length} Ergebnisse</p>
            </div>
            <button
              onClick={() => setEditingOffer({ id: null, docType: activeFilter === 'rahmenvertrag' ? 'rahmenvertrag' : 'angebot' })}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={15} />
              {activeFilter === 'rahmenvertrag' ? 'Neuer Rahmenvertrag' : activeFilter === 'angebot' ? 'Neues Angebot' : 'Neuer Beleg'}
            </button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Titel, Nummer, Kunde suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredOffers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Keine Belege gefunden</p>
              <button
                onClick={() => setEditingOffer({ id: null, docType: activeFilter === 'rahmenvertrag' ? 'rahmenvertrag' : 'angebot' })}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {activeFilter === 'rahmenvertrag' ? 'Neuen Rahmenvertrag erstellen' : 'Neues Angebot erstellen'}
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredOffers.map(offer => {
                const docType = DOC_TYPES[offer.doc_type || 'angebot'] || DOC_TYPES.angebot
                const status = STATUS_LABELS[offer.status] || STATUS_LABELS.entwurf
                return (
                  <button
                    key={offer.id}
                    onClick={() => setEditingOffer({ id: offer.id, docType: offer.doc_type || 'angebot' })}
                    className="w-full text-left px-4 py-3 bg-white rounded-xl hover:bg-gray-50 transition-all flex items-center gap-3 group border border-gray-100 hover:border-gray-200"
                  >
                    {/* Type badge */}
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 ${docType.badgeColor}`}>
                      {docType.badge}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {offer.title || 'Ohne Titel'}
                        </p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {offer.offer_number && (
                          <span className="text-xs text-gray-400">{offer.offer_number}</span>
                        )}
                        {offer.created_at && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDateDE(offer.created_at)}
                          </span>
                        )}
                        {offer.valid_until && (
                          <span className="text-xs text-gray-400">
                            Gueltig bis {formatDateDE(offer.valid_until)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
                      {formatCurrency(offer.total || 0)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
