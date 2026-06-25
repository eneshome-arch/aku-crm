import { useState } from 'react'
import { Phone, Save } from 'lucide-react'

export default function AddCallModal({ contactId, onSaved, onClose }) {
  const [form, setForm] = useState({
    call_date: new Date().toISOString().slice(0, 16),
    result: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.result.trim()) return
    setSaving(true)
    await window.electronAPI.query(
      `INSERT INTO call_history (contact_id, call_date, result, notes) VALUES ($1, $2, $3, $4)`,
      [contactId, form.call_date, form.result, form.notes]
    )
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Phone size={18} className="text-blue-500" /> Anruf hinzufügen</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Datum & Uhrzeit</label>
            <input
              type="datetime-local"
              value={form.call_date}
              onChange={e => setForm({ ...form, call_date: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ergebnis *</label>
            <input
              type="text"
              placeholder="z.B. Rückruf vereinbart, Kein Interesse..."
              value={form.result}
              onChange={e => setForm({ ...form, result: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notizen</label>
            <textarea
              rows={4}
              placeholder="Gesprächsnotizen..."
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.result.trim()}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Save size={14} /> {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
