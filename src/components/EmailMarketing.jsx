import { useState, useEffect, useRef } from 'react'
import { X, Mail, Send, CheckCircle, XCircle, Eye, Users, FileText, AlertCircle, Settings, Save, FolderOpen, Trash2, Plus, History, RefreshCw } from 'lucide-react'
import EmailTemplateBuilder from './EmailTemplateBuilder'

const STATUS_COLORS = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700',
  4: 'bg-purple-100 text-purple-700',
  5: 'bg-orange-100 text-orange-700',
  6: 'bg-yellow-100 text-yellow-700',
  7: 'bg-teal-100 text-teal-700',
  8: 'bg-green-100 text-green-700',
  9: 'bg-emerald-100 text-emerald-800',
  10: 'bg-red-100 text-red-700',
}

const DEFAULT_TEMPLATE = `<p>Sehr geehrte Damen und Herren,</p>

<p>mein Name ist {{absender_name}} und ich wende mich heute an Sie, um Ihnen unser Angebot vorzustellen.</p>

<p>Gerne würde ich mit Ihnen einen Termin vereinbaren, um mehr über Ihre Anforderungen zu erfahren.</p>

<p>Mit freundlichen Grüßen,<br>
{{absender_name}}</p>`

// Variablen ersetzen
function renderTemplate(template, contact, senderName) {
  return template
    .replace(/\{\{firma\}\}/g, contact.company_name || '')
    .replace(/\{\{vorname\}\}/g, contact.first_name || '')
    .replace(/\{\{nachname\}\}/g, contact.last_name || '')
    .replace(/\{\{anrede\}\}/g, contact.first_name ? `Sehr geehrte/r ${contact.first_name} ${contact.last_name || ''}` : 'Sehr geehrte Damen und Herren')
    .replace(/\{\{absender_name\}\}/g, senderName || '')
}

function ContactRow({ contact, selected, onToggle }) {
  const hasEmail = !!contact.email
  return (
    <button
      onClick={() => hasEmail && onToggle(contact)}
      disabled={!hasEmail}
      className={`w-full text-left px-3 py-2.5 rounded-xl mb-1 transition-all border-2 ${
        !hasEmail ? 'opacity-40 cursor-not-allowed border-transparent' :
        selected ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs text-gray-900 truncate">{contact.company_name}</p>
          <p className="text-xs text-gray-400 truncate">{contact.email || 'Keine E-Mail'}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[contact.status]}`}>{contact.status}</span>
          {hasEmail && (
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
              {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

export default function EmailMarketing({ contacts, currentUser, onClose, onOpenSettings }) {
  const [tab, setTab] = useState('contacts') // contacts | template | preview | sending | history
  const [selected, setSelected] = useState([])
  const [subject, setSubject] = useState('Unser Angebot für {{firma}}')
  const [body, setBody] = useState(DEFAULT_TEMPLATE)
  const [bodyJson, setBodyJson] = useState(null)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState([])
  const [previewContact, setPreviewContact] = useState(null)
  const [filterStatus, setFilterStatus] = useState(0)
  const [search, setSearch] = useState('')

  const emailConfig = currentUser?.email_config || null
  const [savedTemplates, setSavedTemplates] = useState([])
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Kampagnen-Verlauf
  const [campaigns, setCampaigns] = useState([])
  const [campaignDetail, setCampaignDetail] = useState(null)
  const [campaignDetailData, setCampaignDetailData] = useState(null)
  const [saveCampaignName, setSaveCampaignName] = useState('')
  const [showCampaignNameInput, setShowCampaignNameInput] = useState(false)
  const lastResults = useRef([])

  const loadCampaigns = async () => {
    const res = await window.electronAPI.campaignsList(currentUser.id)
    if (res.success) setCampaigns(res.campaigns)
  }

  // Vorlagen + Kampagnen laden
  useEffect(() => {
    window.electronAPI.getSettings().then(s => {
      if (s.emailTemplates) setSavedTemplates(s.emailTemplates)
    })
    loadCampaigns()
  }, [])

  const saveTemplate = async () => {
    if (!saveTemplateName.trim()) return
    const tpl = { id: Date.now(), name: saveTemplateName.trim(), subject, body, bodyJson: bodyJson || null, createdAt: new Date().toISOString() }
    const updated = [...savedTemplates, tpl]
    setSavedTemplates(updated)
    await window.electronAPI.setSetting('emailTemplates', updated)
    setSaveTemplateName('')
    setShowSaveInput(false)
  }

  const loadTemplate = (tpl) => {
    setSubject(tpl.subject)
    setBody(tpl.body)
    setBodyJson(tpl.bodyJson || null)
    setShowTemplateLib(false)
  }

  const deleteTemplate = async (id) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    await window.electronAPI.setSetting('emailTemplates', updated)
  }

  const importHtml = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setBody(ev.target.result)
    reader.readAsText(file)
    e.target.value = ''
  }

  const toggle = (c) => setSelected(prev =>
    prev.find(s => s.id === c.id) ? prev.filter(s => s.id !== c.id) : [...prev, c]
  )
  const isSelected = (c) => selected.some(s => s.id === c.id)

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.company_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    const matchStatus = !filterStatus || c.status === filterStatus
    return matchSearch && matchStatus
  })

  const selectAll = () => {
    const withEmail = filtered.filter(c => c.email)
    setSelected(withEmail)
  }

  const handleSend = async () => {
    setSending(true)
    setTab('sending')
    setResults([])

    const recipients = selected.map(c => ({
      to: c.email,
      subject: renderTemplate(subject, c, emailConfig?.senderName || emailConfig?.email),
      html: renderTemplate(body, c, emailConfig?.senderName || emailConfig?.email),
      text: renderTemplate(body.replace(/<[^>]+>/g, ''), c, emailConfig?.senderName || emailConfig?.email),
    }))

    const res = await window.electronAPI.sendEmails(emailConfig, recipients)
    setSending(false)
    if (res.results) {
      setResults(res.results)
      lastResults.current = res.results
      // Kampagnenname-Eingabe nach Versand einblenden
      setSaveCampaignName(subject.replace(/\{\{[^}]+\}\}/g, '').trim() || 'Kampagne')
      setShowCampaignNameInput(true)
    }
  }

  const saveCampaign = async (name) => {
    const n = (name || saveCampaignName).trim()
    if (!n) return
    await window.electronAPI.campaignsSave({
      userId: currentUser.id,
      name: n,
      subject,
      bodyHtml: body,
      bodyJson: bodyJson || null,
      recipients: selected.map(c => ({ id: c.id, email: c.email, company: c.company_name })),
      results: lastResults.current,
    })
    setShowCampaignNameInput(false)
    loadCampaigns()
  }

  const openCampaignDetail = async (campaign) => {
    setCampaignDetail(campaign)
    const res = await window.electronAPI.campaignsGet(campaign.id)
    if (res.success) setCampaignDetailData(res.campaign)
  }

  const deleteCampaign = async (id) => {
    await window.electronAPI.campaignsDelete(id)
    setCampaignDetail(null)
    setCampaignDetailData(null)
    loadCampaigns()
  }

  const reuseCampaign = (campaign) => {
    setSubject(campaign.subject || '')
    setBody(campaign.body_html || '')
    setBodyJson(campaign.body_json || null)
    setCampaignDetail(null)
    setCampaignDetailData(null)
    setTab('template')
  }

  const preview = previewContact || selected[0] || contacts[0]

  const VARIABLES = ['{{firma}}', '{{vorname}}', '{{nachname}}', '{{anrede}}', '{{absender_name}}']

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col" style={{ height: '88vh' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">E-Mail Marketing</h3>
            {!emailConfig && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertCircle size={11} /> Kein E-Mail Konto verbunden
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onOpenSettings} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-colors">
              <Settings size={13} /> E-Mail Konto
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[
            { id: 'contacts', label: 'Empfänger', icon: Users },
            { id: 'templates', label: 'Vorlagen', icon: FolderOpen },
            { id: 'template', label: 'Editor', icon: FileText },
            { id: 'preview', label: 'Vorschau', icon: Eye },
            { id: 'history', label: 'Kampagnen', icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {label}
              {id === 'contacts' && selected.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">{selected.length}</span>
              )}
              {id === 'templates' && savedTemplates.length > 0 && (
                <span className="bg-gray-400 text-white text-xs px-1.5 py-0.5 rounded-full">{savedTemplates.length}</span>
              )}
              {id === 'history' && campaigns.length > 0 && (
                <span className="bg-gray-400 text-white text-xs px-1.5 py-0.5 rounded-full">{campaigns.length}</span>
              )}
            </button>
          ))}
          {tab === 'sending' && (
            <div className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-500">
              <Send size={14} /> Versand
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">

          {/* Empfänger */}
          {tab === 'contacts' && (
            <div className="h-full flex flex-col">
              <div className="px-6 py-3 border-b border-gray-100 flex gap-3 items-center flex-shrink-0">
                <input
                  type="text"
                  placeholder="Suchen..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(Number(e.target.value))}
                  className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 focus:outline-none"
                >
                  <option value={0}>Alle Status</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={selectAll} className="text-xs text-blue-600 font-medium hover:underline whitespace-nowrap">
                  Alle mit E-Mail
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {filtered.map(c => (
                  <ContactRow key={c.id} contact={c} selected={isSelected(c)} onToggle={toggle} />
                ))}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                <p className="text-sm text-gray-500">{selected.length} Empfänger ausgewählt</p>
                <button
                  onClick={() => setTab('template')}
                  disabled={selected.length === 0}
                  className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors"
                >
                  Weiter zur Vorlage →
                </button>
              </div>
            </div>
          )}

          {/* Vorlagen-Tab */}
          {tab === 'templates' && (
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <p className="text-sm text-gray-500">{savedTemplates.length === 0 ? 'Keine gespeicherten Vorlagen' : `${savedTemplates.length} Vorlage${savedTemplates.length !== 1 ? 'n' : ''}`}</p>
                <button
                  onClick={() => setShowSaveInput(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                >
                  <Plus size={12} /> Aktuelle speichern
                </button>
              </div>

              {showSaveInput && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={saveTemplateName}
                    onChange={e => setSaveTemplateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTemplate()}
                    placeholder="Vorlagenname..."
                    autoFocus
                    className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button onClick={saveTemplate} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors">
                    <Save size={13} /> Speichern
                  </button>
                  <button onClick={() => setShowSaveInput(false)} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-blue-100 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-6">
                {savedTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                      <FolderOpen size={22} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Noch keine Vorlagen gespeichert</p>
                    <p className="text-xs text-gray-400 mt-1">Gestalte eine E-Mail im Editor und speichere sie als Vorlage</p>
                    <button onClick={() => setTab('template')} className="mt-4 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                      Zum Editor →
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {savedTemplates.map(t => (
                      <div key={t.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Minivorschau */}
                        <div className="h-32 bg-gray-50 overflow-hidden relative">
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ transform: 'scale(0.35)', transformOrigin: 'top left', width: '286%', height: '286%' }}
                            dangerouslySetInnerHTML={{ __html: t.body }}
                          />
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate mt-0.5">{t.subject}</p>
                          <p className="text-xs text-gray-300 mt-1">{new Date(t.createdAt).toLocaleDateString('de-DE')}</p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => { loadTemplate(t); setTab('template') }}
                              className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                            >
                              Verwenden
                            </button>
                            <button
                              onClick={() => deleteTemplate(t.id)}
                              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Template-Editor */}
          {tab === 'template' && (
            <div className="h-full flex flex-col">
              {/* Betreff-Leiste */}
              <div className="px-4 py-2.5 border-b border-gray-100 flex-shrink-0 flex items-center gap-3">
                <label className="text-xs font-semibold text-gray-500 whitespace-nowrap">Betreff</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <div className="flex gap-1 flex-shrink-0">
                  {VARIABLES.map(v => (
                    <span key={v} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg font-mono">{v}</span>
                  ))}
                </div>
                <button
                  onClick={() => setShowSaveInput(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                >
                  <Save size={12} /> Speichern
                </button>
              </div>

              {showSaveInput && (
                <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
                  <input
                    type="text"
                    value={saveTemplateName}
                    onChange={e => setSaveTemplateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveTemplate()}
                    placeholder="Vorlagenname..."
                    autoFocus
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button onClick={saveTemplate} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors">
                    <Save size={11} /> Speichern
                  </button>
                  <button onClick={() => setShowSaveInput(false)} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Visual Email Builder */}
              <div className="flex-1 overflow-hidden">
                <EmailTemplateBuilder
                  key={bodyJson ? JSON.stringify(bodyJson).slice(0, 40) : 'default'}
                  initialJson={bodyJson}
                  onChange={(html, json) => {
                    setBody(html)
                    setBodyJson(json)
                  }}
                />
              </div>

              <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                <button onClick={() => setTab('contacts')} className="text-sm text-gray-500 hover:text-gray-700">← Zurück</button>
                <button onClick={() => setTab('preview')} className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors">
                  Vorschau →
                </button>
              </div>
            </div>
          )}

          {/* Vorschau */}
          {tab === 'preview' && (
            <div className="h-full flex flex-col">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-500">Vorschau für:</span>
                <select
                  value={preview?.id || ''}
                  onChange={e => setPreviewContact(selected.find(c => c.id === Number(e.target.value)))}
                  className="px-3 py-1.5 bg-gray-100 rounded-xl text-sm focus:outline-none"
                >
                  {selected.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              {preview && (
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <div className="max-w-2xl mx-auto bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                    <div className="px-6 py-4 bg-white border-b border-gray-200">
                      <p className="text-xs text-gray-400 mb-1">Betreff</p>
                      <p className="font-semibold text-gray-900">{renderTemplate(subject, preview, emailConfig?.senderName)}</p>
                      <p className="text-xs text-gray-400 mt-2">An: {preview.email}</p>
                    </div>
                    <div
                      className="px-6 py-5 text-sm text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderTemplate(body, preview, emailConfig?.senderName) }}
                    />
                  </div>
                </div>
              )}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                <button onClick={() => setTab('template')} className="text-sm text-gray-500 hover:text-gray-700">← Zurück</button>
                <button
                  onClick={handleSend}
                  disabled={!emailConfig || selected.length === 0}
                  className="px-6 py-2.5 text-sm font-bold bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl transition-colors flex items-center gap-2"
                >
                  <Send size={15} /> {selected.length} E-Mails senden
                </button>
              </div>
            </div>
          )}

          {/* Versand */}
          {tab === 'sending' && (
            <div className="h-full flex flex-col items-center justify-center px-6">
              {sending ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-gray-900">E-Mails werden versendet...</p>
                  <p className="text-gray-500 mt-1 text-sm">{selected.length} Empfänger</p>
                </div>
              ) : (
                <div className="w-full max-w-lg">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Versand abgeschlossen</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      {results.filter(r => r.success).length} erfolgreich · {results.filter(r => !r.success).length} fehlgeschlagen
                    </p>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {results.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        {r.success ? <CheckCircle size={15} className="text-green-500 flex-shrink-0" /> : <XCircle size={15} className="text-red-500 flex-shrink-0" />}
                        <p className="text-sm text-gray-700 truncate">{r.email}</p>
                        {!r.success && <p className="text-xs text-red-500 truncate">{r.error}</p>}
                      </div>
                    ))}
                  </div>
                  {/* Kampagne speichern */}
                  {showCampaignNameInput ? (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-sm font-semibold text-blue-800 mb-2">Kampagne speichern</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={saveCampaignName}
                          onChange={e => setSaveCampaignName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveCampaign()}
                          placeholder="Kampagnenname..."
                          autoFocus
                          className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button onClick={() => saveCampaign()} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5">
                          <Save size={13} /> Speichern
                        </button>
                        <button onClick={() => setShowCampaignNameInput(false)} className="px-3 py-2 text-sm text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors">
                          Überspringen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={onClose} className="w-full mt-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors">
                      Fertig
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Kampagnen-Verlauf */}
          {tab === 'history' && (
            <div className="h-full flex">
              {/* Kampagnenliste */}
              <div className={`flex flex-col border-r border-gray-100 ${campaignDetail ? 'w-72 flex-shrink-0' : 'flex-1'}`}>
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-700">Gesendete Kampagnen</p>
                  <button onClick={loadCampaigns} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors" title="Aktualisieren">
                    <RefreshCw size={13} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                        <History size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">Noch keine Kampagnen</p>
                      <p className="text-xs text-gray-400 mt-1">Gesendete Kampagnen erscheinen hier</p>
                    </div>
                  ) : campaigns.map(c => (
                    <button
                      key={c.id}
                      onClick={() => openCampaignDetail(c)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${campaignDetail?.id === c.id ? 'border-blue-400 bg-blue-50' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}
                    >
                      <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.subject}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle size={11} /> {c.success_count}
                        </span>
                        {c.fail_count > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                            <XCircle size={11} /> {c.fail_count}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {new Date(c.sent_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Kampagnen-Detail */}
              {campaignDetail && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{campaignDetail.name}</p>
                      <p className="text-xs text-gray-400">{new Date(campaignDetail.sent_at).toLocaleString('de-DE')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => campaignDetailData && reuseCampaign(campaignDetailData)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <RefreshCw size={12} /> Wiederverwenden
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaignDetail.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                      >
                        <Trash2 size={12} /> Löschen
                      </button>
                      <button onClick={() => { setCampaignDetail(null); setCampaignDetailData(null) }} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-gray-900">{campaignDetail.recipient_count}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Empfänger</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{campaignDetail.success_count}</p>
                        <p className="text-xs text-green-500 mt-0.5">Erfolgreich</p>
                      </div>
                      <div className="bg-red-50 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-500">{campaignDetail.fail_count}</p>
                        <p className="text-xs text-red-400 mt-0.5">Fehlgeschlagen</p>
                      </div>
                    </div>

                    {/* Betreff */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-1">Betreff</p>
                      <p className="text-sm font-medium text-gray-800">{campaignDetail.subject}</p>
                    </div>

                    {/* Ergebnisse */}
                    {campaignDetailData?.results && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Versandstatus</p>
                        <div className="space-y-1.5">
                          {campaignDetailData.results.map((r, i) => (
                            <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${r.success ? 'bg-green-50' : 'bg-red-50'}`}>
                              {r.success
                                ? <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
                                : <XCircle size={13} className="text-red-500 flex-shrink-0" />}
                              <p className="text-sm text-gray-700 truncate flex-1">{r.email}</p>
                              {!r.success && <p className="text-xs text-red-400 truncate max-w-[140px]">{r.error}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
