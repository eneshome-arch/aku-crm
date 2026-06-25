import { useState, useEffect, useCallback } from 'react'
import { Pencil, Save, Trash2, X, Phone, Plus } from 'lucide-react'
import AddCallModal from './AddCallModal'

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

function formatDateTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function toInputDateTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toISOString().slice(0, 16)
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Field({ label, value, editMode, type = 'text', onChange, rows }) {
  if (editMode) {
    if (rows) {
      return (
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <textarea
            rows={rows}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
          />
        </div>
      )
    }
    return (
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
      </div>
    )
  }
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-gray-400 mb-0.5">{label}</p>
      {value ? (
        type === 'url' ? (
          <a href={value} className="text-sm text-blue-600 hover:underline">{value}</a>
        ) : (
          <p className="text-sm text-gray-800">{value}</p>
        )
      ) : (
        <p className="text-sm text-gray-300">—</p>
      )}
    </div>
  )
}

export default function ContactProfile({ contact, onUpdated, onDeleted }) {
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({})
  const [callHistory, setCallHistory] = useState([])
  const [showAddCall, setShowAddCall] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setForm({ ...contact, next_followup: toInputDateTime(contact.next_followup) })
    setEditMode(false)
  }, [contact])

  const loadCallHistory = useCallback(async () => {
    const res = await window.electronAPI.query(
      `SELECT * FROM call_history WHERE contact_id = $1 ORDER BY call_date DESC`,
      [contact.id]
    )
    if (res.rows) setCallHistory(res.rows)
  }, [contact.id])

  useEffect(() => {
    loadCallHistory()
  }, [loadCallHistory])

  const set = (field) => (value) => setForm(f => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const res = await window.electronAPI.query(
      `UPDATE contacts SET
        company_name=$1, industry=$2, company_size=$3, address=$4, city=$5, postal_code=$6, website=$7,
        first_name=$8, last_name=$9, position=$10, phone_central=$11, phone_direct=$12, mobile=$13, email=$14,
        status=$15, next_followup=$16, followup_note=$17, revenue_potential=$18, contract_notes=$19,
        updated_at=NOW()
       WHERE id=$20
       RETURNING *`,
      [
        form.company_name, form.industry, form.company_size, form.address, form.city, form.postal_code, form.website,
        form.first_name, form.last_name, form.position, form.phone_central, form.phone_direct, form.mobile, form.email,
        form.status, form.next_followup || null, form.followup_note, form.revenue_potential || null, form.contract_notes,
        contact.id
      ]
    )
    setSaving(false)
    setEditMode(false)
    if (res.rows?.[0]) {
      onUpdated(res.rows[0])
    }
  }

  const handleDelete = async () => {
    await window.electronAPI.query(`DELETE FROM contacts WHERE id=$1`, [contact.id])
    onDeleted()
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 pt-2">
          <h2 className="text-2xl font-bold text-gray-900">{contact.company_name}</h2>
          <span className={`text-xs px-3 py-1 rounded-full font-semibold ${STATUS_COLORS[contact.status] || STATUS_COLORS[1]}`}>
            {STATUS_LABELS[contact.status]}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Löschen"
              >
                <Trash2 size={17} />
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Pencil size={14} /> Bearbeiten
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setEditMode(false); setForm({ ...contact, next_followup: toInputDateTime(contact.next_followup) }) }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title="Abbrechen"
              >
                <X size={17} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Save size={14} /> {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-8 py-6 max-w-3xl">
        {/* Firmendaten */}
        <Section title="Firmendaten">
          <div className="grid grid-cols-2 gap-x-6">
            <Field label="Firmenname" value={form.company_name} editMode={editMode} onChange={set('company_name')} />
            <Field label="Branche" value={form.industry} editMode={editMode} onChange={set('industry')} />
            <Field label="Firmengröße" value={form.company_size} editMode={editMode} onChange={set('company_size')} />
            <Field label="Adresse" value={form.address} editMode={editMode} onChange={set('address')} />
            <Field label="Stadt" value={form.city} editMode={editMode} onChange={set('city')} />
            <Field label="PLZ" value={form.postal_code} editMode={editMode} onChange={set('postal_code')} />
            <Field label="Website" value={form.website} type="url" editMode={editMode} onChange={set('website')} />
          </div>
        </Section>

        {/* Ansprechpartner */}
        <Section title="Ansprechpartner">
          <div className="grid grid-cols-2 gap-x-6">
            <Field label="Vorname" value={form.first_name} editMode={editMode} onChange={set('first_name')} />
            <Field label="Nachname" value={form.last_name} editMode={editMode} onChange={set('last_name')} />
            <Field label="Position / Titel" value={form.position} editMode={editMode} onChange={set('position')} />
            <Field label="E-Mail" value={form.email} type="email" editMode={editMode} onChange={set('email')} />
            <Field label="Telefon Zentrale" value={form.phone_central} type="tel" editMode={editMode} onChange={set('phone_central')} />
            <Field label="Telefon Direkt" value={form.phone_direct} type="tel" editMode={editMode} onChange={set('phone_direct')} />
            <Field label="Mobil" value={form.mobile} type="tel" editMode={editMode} onChange={set('mobile')} />
          </div>
        </Section>

        {/* Akquise-Status */}
        <Section title="Akquise-Status">
          {editMode ? (
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={form.status || 1}
                onChange={e => set('status')(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{k}. {v}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-400 mb-1">Status</p>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[form.status] || STATUS_COLORS[1]}`}>
                {form.status}. {STATUS_LABELS[form.status]}
              </span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6">
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-400 mb-0.5">Nächstes Followup</label>
              {editMode ? (
                <input
                  type="datetime-local"
                  value={form.next_followup || ''}
                  onChange={e => set('next_followup')(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              ) : (
                <p className="text-sm text-gray-800">
                  {form.next_followup ? formatDateTime(form.next_followup) : <span className="text-gray-300">—</span>}
                </p>
              )}
            </div>
          </div>
          <Field label="Erinnerungsnotiz" value={form.followup_note} editMode={editMode} onChange={set('followup_note')} rows={3} />
        </Section>

        {/* Rahmenvertrag */}
        <Section title="Rahmenvertrag">
          <div className="grid grid-cols-2 gap-x-6">
            <Field label="Umsatzpotenzial (€)" value={form.revenue_potential} type="number" editMode={editMode} onChange={set('revenue_potential')} />
          </div>
          <Field label="Notizen zur Chance" value={form.contract_notes} editMode={editMode} onChange={set('contract_notes')} rows={3} />
        </Section>

        {/* Gesprächshistorie */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Gesprächshistorie ({callHistory.length})
            </h3>
            <button
              onClick={() => setShowAddCall(true)}
              className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Plus size={12} /> Anruf hinzufügen
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {callHistory.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400 text-center">Noch keine Anrufe eingetragen</p>
            ) : callHistory.map(call => (
              <div key={call.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-500">{formatDateTime(call.call_date)}</span>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{call.result}</span>
                </div>
                {call.notes && <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{call.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Call Modal */}
      {showAddCall && (
        <AddCallModal
          contactId={contact.id}
          onSaved={() => { setShowAddCall(false); loadCallHistory() }}
          onClose={() => setShowAddCall(false)}
        />
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontakt löschen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{contact.company_name}</strong> wird dauerhaft gelöscht, inkl. aller Gesprächsnotizen.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
