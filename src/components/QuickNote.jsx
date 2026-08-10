import { api } from '../api'
import { useState, useEffect, useRef } from 'react'
import { StickyNote, X, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

function formatDate(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
    ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function QuickNote({ userId }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [notes, setNotes] = useState([])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  const loadNotes = async () => {
    if (!userId) return
    const res = await api.notesList(userId)
    if (res.success) setNotes(res.notes)
  }

  useEffect(() => {
    if (open) loadNotes()
  }, [open, userId])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleSave = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    const res = await api.notesSave(userId, text.trim())
    setSaving(false)
    if (res.success) {
      setText('')
      loadNotes()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleDelete = async (id) => {
    await api.notesDelete(id, userId)
    loadNotes()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="Schnellnotiz"
      >
        <StickyNote size={20} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ maxHeight: expanded ? '70vh' : '320px' }}>
      {/* Header */}
      <div className="bg-yellow-400 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-yellow-900" />
          <span className="font-semibold text-yellow-900 text-sm">Notizen</span>
          {notes.length > 0 && (
            <span className="text-xs bg-yellow-500 text-yellow-900 rounded-full px-1.5 py-0.5 font-bold">{notes.length}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-yellow-900 hover:bg-yellow-500 rounded-lg transition-colors">
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 text-yellow-900 hover:bg-yellow-500 rounded-lg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Schnellnotiz eingeben..."
            rows={2}
            className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white resize-none"
          />
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="self-end w-9 h-9 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <StickyNote size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Noch keine Notizen</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notes.map(n => (
              <div key={n.id} className="group px-3 py-2 bg-gray-50 rounded-xl hover:bg-yellow-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap break-words flex-1">{n.text}</p>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 mt-0.5"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
