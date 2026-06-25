import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Type, Image, MousePointer, Minus, AlignCenter, Trash2,
  ChevronUp, ChevronDown, Plus, Copy, Palette, Bold, Italic,
  Underline, AlignLeft, AlignRight, Link, Upload, X
} from 'lucide-react'

// ── Block-Typen ────────────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: 'header',  label: 'Header',    icon: Type },
  { type: 'text',    label: 'Text',      icon: Type },
  { type: 'image',   label: 'Bild',      icon: Image },
  { type: 'button',  label: 'Button',    icon: MousePointer },
  { type: 'divider', label: 'Trennlinie',icon: Minus },
  { type: 'spacer',  label: 'Abstand',   icon: AlignCenter },
  { type: 'columns', label: '2 Spalten', icon: AlignCenter },
]

const defaultBlock = (type) => {
  const id = Date.now() + Math.random()
  const base = { id, type }
  switch (type) {
    case 'header':  return { ...base, title: 'Betreff der E-Mail', subtitle: '', bgColor: '#1e40af', textColor: '#ffffff', align: 'center', padding: 32 }
    case 'text':    return { ...base, html: '<p>Ihr Text hier...</p>', padding: 16 }
    case 'image':   return { ...base, src: '', alt: '', width: 100, align: 'center', borderRadius: 0, link: '', padding: 8 }
    case 'button':  return { ...base, text: 'Jetzt Kontakt aufnehmen', href: '', bgColor: '#2563eb', textColor: '#ffffff', align: 'center', borderRadius: 8, padding: 12 }
    case 'divider': return { ...base, color: '#e5e7eb', thickness: 1, margin: 16 }
    case 'spacer':  return { ...base, height: 24 }
    case 'columns': return { ...base, leftHtml: '<p>Linke Spalte</p>', rightHtml: '<p>Rechte Spalte</p>', padding: 16 }
    default: return base
  }
}

// ── HTML Export ─────────────────────────────────────────────────────────────

export function blocksToHtml(blocks, bgColor = '#f5f5f5', contentBg = '#ffffff') {
  const blockHtml = blocks.map(b => {
    switch (b.type) {
      case 'header':
        return `<div style="background:${b.bgColor};padding:${b.padding}px;text-align:${b.align};">
          <h1 style="margin:0;color:${b.textColor};font-family:Arial,sans-serif;font-size:28px;font-weight:bold;">${b.title}</h1>
          ${b.subtitle ? `<p style="margin:8px 0 0;color:${b.textColor};opacity:0.85;font-family:Arial,sans-serif;font-size:15px;">${b.subtitle}</p>` : ''}
        </div>`
      case 'text':
        return `<div style="padding:${b.padding}px 24px;font-family:Arial,sans-serif;font-size:15px;color:#374151;line-height:1.7;">${b.html}</div>`
      case 'image':
        if (!b.src) return ''
        const imgEl = `<img src="${b.src}" alt="${b.alt}" style="max-width:${b.width}%;height:auto;border-radius:${b.borderRadius}px;display:block;" />`
        return `<div style="padding:${b.padding}px;text-align:${b.align};">${b.link ? `<a href="${b.link}" style="display:inline-block;">${imgEl}</a>` : imgEl}</div>`
      case 'button':
        return `<div style="padding:${b.padding}px;text-align:${b.align};">
          <a href="${b.href}" style="display:inline-block;background:${b.bgColor};color:${b.textColor};padding:14px 32px;border-radius:${b.borderRadius}px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;">${b.text}</a>
        </div>`
      case 'divider':
        return `<div style="padding:${b.margin}px 24px;"><hr style="border:none;border-top:${b.thickness}px solid ${b.color};margin:0;" /></div>`
      case 'spacer':
        return `<div style="height:${b.height}px;"></div>`
      case 'columns':
        return `<div style="display:table;width:100%;padding:${b.padding}px;">
          <div style="display:table-cell;width:50%;padding-right:8px;vertical-align:top;font-family:Arial,sans-serif;font-size:15px;color:#374151;">${b.leftHtml}</div>
          <div style="display:table-cell;width:50%;padding-left:8px;vertical-align:top;font-family:Arial,sans-serif;font-size:15px;color:#374151;">${b.rightHtml}</div>
        </div>`
      default: return ''
    }
  }).join('\n')

  return `<div style="background:${bgColor};padding:24px 0;min-height:100%;">
  <div style="max-width:600px;margin:0 auto;background:${contentBg};border-radius:8px;overflow:hidden;">
    ${blockHtml}
    <div style="padding:16px 24px;text-align:center;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif;">Diese E-Mail wurde über Aku CRM versendet.</p>
    </div>
  </div>
</div>`
}

// ── Inline Text Editor (contenteditable) ───────────────────────────────────

function InlineEditor({ value, onChange, className = '', style = {} }) {
  const ref = useRef(null)
  const synced = useRef(false)

  if (ref.current && !synced.current) {
    ref.current.innerHTML = value
    synced.current = true
  }

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={() => onChange(ref.current?.innerHTML || '')}
      className={`focus:outline-none ${className}`}
      style={style}
    />
  )
}

// ── Block Renderer ──────────────────────────────────────────────────────────

function BlockPreview({ block, selected, onSelect, onEdit }) {
  const fileRef = useRef(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onEdit({ src: ev.target.result })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const content = (() => {
    switch (block.type) {
      case 'header':
        return (
          <div
            style={{ background: block.bgColor, padding: block.padding, textAlign: block.align }}
            onClick={onSelect}
          >
            <InlineEditor
              value={block.title}
              onChange={v => onEdit({ title: v })}
              style={{ color: block.textColor, fontSize: 26, fontWeight: 'bold', margin: 0, display: 'block' }}
            />
            {(block.subtitle !== undefined) && (
              <InlineEditor
                value={block.subtitle}
                onChange={v => onEdit({ subtitle: v })}
                style={{ color: block.textColor, opacity: 0.85, fontSize: 14, marginTop: 6, display: 'block' }}
                className="mt-1"
              />
            )}
          </div>
        )
      case 'text':
        return (
          <div
            style={{ padding: `${block.padding}px 24px`, fontSize: 14, lineHeight: 1.7, color: '#374151' }}
            onClick={onSelect}
          >
            <InlineEditor
              value={block.html}
              onChange={v => onEdit({ html: v })}
            />
          </div>
        )
      case 'image':
        return (
          <div style={{ padding: block.padding, textAlign: block.align }} onClick={onSelect}>
            {block.src ? (
              <img
                src={block.src}
                alt={block.alt}
                style={{ maxWidth: `${block.width}%`, borderRadius: block.borderRadius, display: 'inline-block' }}
              />
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                style={{ minHeight: 120, padding: 24 }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} className="text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Bild hochladen</p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF, SVG</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )
      case 'button':
        return (
          <div style={{ padding: block.padding, textAlign: block.align }} onClick={onSelect}>
            <span style={{
              display: 'inline-block',
              background: block.bgColor,
              color: block.textColor,
              padding: '12px 28px',
              borderRadius: block.borderRadius,
              fontWeight: 'bold',
              fontSize: 14,
              cursor: 'pointer',
            }}>
              <InlineEditor
                value={block.text}
                onChange={v => onEdit({ text: v })}
                style={{ display: 'inline' }}
              />
            </span>
          </div>
        )
      case 'divider':
        return (
          <div style={{ padding: `${block.margin}px 24px` }} onClick={onSelect}>
            <hr style={{ border: 'none', borderTop: `${block.thickness}px solid ${block.color}`, margin: 0 }} />
          </div>
        )
      case 'spacer':
        return (
          <div
            style={{ height: block.height, background: selected ? '#eff6ff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onSelect}
          >
            {selected && <span className="text-xs text-blue-400">{block.height}px Abstand</span>}
          </div>
        )
      case 'columns':
        return (
          <div style={{ display: 'flex', gap: 12, padding: block.padding }} onClick={onSelect}>
            <div style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
              <InlineEditor value={block.leftHtml} onChange={v => onEdit({ leftHtml: v })} />
            </div>
            <div style={{ width: 1, background: '#e5e7eb', flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
              <InlineEditor value={block.rightHtml} onChange={v => onEdit({ rightHtml: v })} />
            </div>
          </div>
        )
      default: return null
    }
  })()

  return (
    <div
      className={`relative group transition-all ${selected ? 'ring-2 ring-blue-400 ring-inset' : 'hover:ring-1 hover:ring-gray-300 hover:ring-inset'}`}
      style={{ cursor: 'default' }}
    >
      {content}
    </div>
  )
}

// ── Block Settings Panel ───────────────────────────────────────────────────

function BlockSettings({ block, onChange, onImageUpload }) {
  const fileRef = useRef(null)

  const set = (key, val) => onChange({ ...block, [key]: val })

  const label = (text) => <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{text}</label>
  const inputCls = "w-full px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
  const row = (children) => <div className="mb-4">{children}</div>

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => set('src', ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  switch (block.type) {
    case 'header': return (
      <div>
        {row(<>{label('Titel')}<input className={inputCls} value={block.title} onChange={e => set('title', e.target.value)} /></>)}
        {row(<>{label('Untertitel')}<input className={inputCls} value={block.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Optional..." /></>)}
        {row(<>{label('Ausrichtung')}
          <div className="flex gap-2">
            {['left','center','right'].map(a => (
              <button key={a} onClick={() => set('align', a)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors ${block.align === a ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts'}
              </button>
            ))}
          </div>
        </>)}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>{label('Hintergrund')}<input type="color" value={block.bgColor} onChange={e => set('bgColor', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer border border-gray-200" /></div>
          <div>{label('Textfarbe')}<input type="color" value={block.textColor} onChange={e => set('textColor', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer border border-gray-200" /></div>
        </div>
        {row(<>{label(`Innenabstand: ${block.padding}px`)}<input type="range" min={8} max={80} value={block.padding} onChange={e => set('padding', Number(e.target.value))} className="w-full" /></>)}
      </div>
    )

    case 'image': return (
      <div>
        {row(<>
          {label('Bild')}
          <div className="space-y-2">
            <button onClick={() => fileRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors">
              <Upload size={16} /> Bild hochladen
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <input className={inputCls} value={block.src} onChange={e => set('src', e.target.value)} placeholder="oder Bild-URL eingeben..." />
            {block.src && <button onClick={() => set('src', '')} className="text-xs text-red-500 hover:underline flex items-center gap-1"><X size={11} /> Bild entfernen</button>}
          </div>
        </>)}
        {row(<>{label('Alt-Text')}<input className={inputCls} value={block.alt} onChange={e => set('alt', e.target.value)} placeholder="Bildbeschreibung" /></>)}
        {row(<>{label('Link (optional)')}<input className={inputCls} value={block.link} onChange={e => set('link', e.target.value)} placeholder="https://..." /></>)}
        {row(<>{label(`Breite: ${block.width}%`)}<input type="range" min={20} max={100} value={block.width} onChange={e => set('width', Number(e.target.value))} className="w-full" /></>)}
        {row(<>{label(`Eckenradius: ${block.borderRadius}px`)}<input type="range" min={0} max={32} value={block.borderRadius} onChange={e => set('borderRadius', Number(e.target.value))} className="w-full" /></>)}
        {row(<>{label('Ausrichtung')}
          <div className="flex gap-2">
            {['left','center','right'].map(a => (
              <button key={a} onClick={() => set('align', a)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors ${block.align === a ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts'}
              </button>
            ))}
          </div>
        </>)}
      </div>
    )

    case 'button': return (
      <div>
        {row(<>{label('Beschriftung')}<input className={inputCls} value={block.text} onChange={e => set('text', e.target.value)} /></>)}
        {row(<>{label('Link (URL)')}<input className={inputCls} value={block.href} onChange={e => set('href', e.target.value)} placeholder="https://..." /></>)}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>{label('Hintergrund')}<input type="color" value={block.bgColor} onChange={e => set('bgColor', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer border border-gray-200" /></div>
          <div>{label('Textfarbe')}<input type="color" value={block.textColor} onChange={e => set('textColor', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer border border-gray-200" /></div>
        </div>
        {row(<>{label('Ausrichtung')}
          <div className="flex gap-2">
            {['left','center','right'].map(a => (
              <button key={a} onClick={() => set('align', a)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-colors ${block.align === a ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts'}
              </button>
            ))}
          </div>
        </>)}
        {row(<>{label(`Eckenradius: ${block.borderRadius}px`)}<input type="range" min={0} max={32} value={block.borderRadius} onChange={e => set('borderRadius', Number(e.target.value))} className="w-full" /></>)}
        {row(<>{label(`Innenabstand: ${block.padding}px`)}<input type="range" min={4} max={40} value={block.padding} onChange={e => set('padding', Number(e.target.value))} className="w-full" /></>)}
      </div>
    )

    case 'divider': return (
      <div>
        {row(<>{label('Farbe')}<input type="color" value={block.color} onChange={e => set('color', e.target.value)} className="w-full h-9 rounded-xl cursor-pointer border border-gray-200" /></>)}
        {row(<>{label(`Stärke: ${block.thickness}px`)}<input type="range" min={1} max={8} value={block.thickness} onChange={e => set('thickness', Number(e.target.value))} className="w-full" /></>)}
        {row(<>{label(`Außenabstand: ${block.margin}px`)}<input type="range" min={0} max={48} value={block.margin} onChange={e => set('margin', Number(e.target.value))} className="w-full" /></>)}
      </div>
    )

    case 'spacer': return (
      <div>
        {row(<>{label(`Höhe: ${block.height}px`)}<input type="range" min={8} max={120} value={block.height} onChange={e => set('height', Number(e.target.value))} className="w-full" /></>)}
      </div>
    )

    case 'text':
    case 'columns': return (
      <div>
        <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">Text direkt im Editor bearbeiten. Markiere Text für Formatierung.</p>
        {row(<>{label(`Innenabstand: ${block.padding}px`)}<input type="range" min={4} max={48} value={block.padding} onChange={e => set('padding', Number(e.target.value))} className="w-full" /></>)}
      </div>
    )

    default: return null
  }
}

// ── Haupt-Komponente ────────────────────────────────────────────────────────

const INITIAL_BLOCKS = [
  { ...defaultBlock('header'), title: 'Ihr Name / Ihre Firma', subtitle: 'Angebot & Zusammenarbeit' },
  { ...defaultBlock('text'), html: '<p>Sehr geehrte Damen und Herren,</p><p>mein Name ist <strong>{{absender_name}}</strong> und ich wende mich heute an <strong>{{firma}}</strong>, um Ihnen unser Angebot vorzustellen.</p><p>Wir würden uns freuen, mit Ihnen eine langfristige Zusammenarbeit zu beginnen.</p>' },
  { ...defaultBlock('button'), text: 'Jetzt Kontakt aufnehmen', href: '' },
  { ...defaultBlock('divider') },
  { ...defaultBlock('text'), html: '<p style="font-size:13px;color:#6b7280;">Mit freundlichen Grüßen,<br><strong>{{absender_name}}</strong></p>' },
]

export default function EmailTemplateBuilder({ initialJson, onChange }) {
  const [blocks, setBlocks] = useState(() => {
    if (Array.isArray(initialJson)) return initialJson
    try {
      const parsed = typeof initialJson === 'string' ? JSON.parse(initialJson) : null
      if (Array.isArray(parsed)) return parsed
    } catch {}
    return INITIAL_BLOCKS
  })
  const [selectedId, setSelectedId] = useState(null)
  const [bgColor, setBgColor] = useState('#f3f4f6')
  const [contentBg, setContentBg] = useState('#ffffff')

  const selectedBlock = blocks.find(b => b.id === selectedId)

  // Fire initial onChange so parent body state is set on mount
  useEffect(() => {
    onChange(blocksToHtml(blocks, bgColor, contentBg), blocks)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = useCallback((newBlocks, newBg, newContentBg) => {
    setBlocks(newBlocks)
    const bg = newBg ?? bgColor
    const cbg = newContentBg ?? contentBg
    onChange(blocksToHtml(newBlocks, bg, cbg), newBlocks)
  }, [onChange, bgColor, contentBg])

  const addBlock = (type, afterId = null) => {
    const nb = defaultBlock(type)
    let newBlocks
    if (afterId) {
      const idx = blocks.findIndex(b => b.id === afterId)
      newBlocks = [...blocks.slice(0, idx + 1), nb, ...blocks.slice(idx + 1)]
    } else {
      newBlocks = [...blocks, nb]
    }
    update(newBlocks)
    setSelectedId(nb.id)
  }

  const editBlock = (id, changes) => {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, ...changes } : b)
    update(newBlocks)
  }

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === blocks.length - 1) return
    const newBlocks = [...blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[newBlocks[idx], newBlocks[swap]] = [newBlocks[swap], newBlocks[idx]]
    update(newBlocks)
  }

  const deleteBlock = (id) => {
    update(blocks.filter(b => b.id !== id))
    setSelectedId(null)
  }

  const duplicateBlock = (id) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    const nb = { ...block, id: Date.now() + Math.random() }
    const idx = blocks.findIndex(b => b.id === id)
    const newBlocks = [...blocks.slice(0, idx + 1), nb, ...blocks.slice(idx + 1)]
    update(newBlocks)
    setSelectedId(nb.id)
  }

  return (
    <div className="flex border-0 overflow-hidden bg-gray-50 h-full">

      {/* ── Linke Sidebar: Block-Palette ── */}
      <div className="w-36 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="px-3 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Blöcke</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              onClick={() => addBlock(type, selectedId)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors text-left"
            >
              <Icon size={14} className="flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
        {/* Global Design */}
        <div className="p-3 border-t border-gray-100 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Design</p>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={e => { setBgColor(e.target.value); update(blocks, e.target.value, contentBg) }}
              className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" title="Hintergrundfarbe" />
            <span className="text-xs text-gray-500">Hintergrund</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={contentBg} onChange={e => { setContentBg(e.target.value); update(blocks, bgColor, e.target.value) }}
              className="w-7 h-7 rounded-lg cursor-pointer border border-gray-200 flex-shrink-0" title="E-Mail Hintergrund" />
            <span className="text-xs text-gray-500">E-Mail</span>
          </div>
        </div>
      </div>

      {/* ── Mitte: E-Mail Canvas ── */}
      <div className="flex-1 overflow-y-auto p-4" style={{ background: bgColor }}>
        <div className="max-w-lg mx-auto rounded-xl overflow-hidden shadow-sm" style={{ background: contentBg }}>
          {blocks.map((block, idx) => (
            <div key={block.id} className="relative group">
              {/* Block Controls (hover) */}
              <div className={`absolute top-1 right-1 z-10 flex items-center gap-1 transition-opacity ${selectedId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button onClick={() => moveBlock(block.id, 'up')} disabled={idx === 0}
                  className="w-6 h-6 bg-white rounded-lg shadow flex items-center justify-center text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-colors">
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => moveBlock(block.id, 'down')} disabled={idx === blocks.length - 1}
                  className="w-6 h-6 bg-white rounded-lg shadow flex items-center justify-center text-gray-500 hover:text-blue-600 disabled:opacity-30 transition-colors">
                  <ChevronDown size={12} />
                </button>
                <button onClick={() => duplicateBlock(block.id)}
                  className="w-6 h-6 bg-white rounded-lg shadow flex items-center justify-center text-gray-500 hover:text-blue-600 transition-colors">
                  <Copy size={11} />
                </button>
                <button onClick={() => deleteBlock(block.id)}
                  className="w-6 h-6 bg-white rounded-lg shadow flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors">
                  <Trash2 size={11} />
                </button>
              </div>

              <BlockPreview
                block={block}
                selected={selectedId === block.id}
                onSelect={() => setSelectedId(block.id === selectedId ? null : block.id)}
                onEdit={(changes) => editBlock(block.id, changes)}
              />
            </div>
          ))}

          {/* Footer */}
          <div style={{ padding: '12px 24px', textAlign: 'center', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontFamily: 'Arial,sans-serif' }}>
              Diese E-Mail wurde über Aku CRM versendet.
            </p>
          </div>
        </div>

        {/* Block hinzufügen (unten) */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setSelectedId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm text-sm text-gray-500 hover:text-blue-600 hover:shadow transition-all"
          >
            <Plus size={14} /> Block hinzufügen (links auswählen)
          </button>
        </div>
      </div>

      {/* ── Rechte Sidebar: Block-Einstellungen ── */}
      <div className="w-56 bg-white border-l border-gray-100 flex flex-col flex-shrink-0">
        {selectedBlock ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {BLOCK_TYPES.find(b => b.type === selectedBlock.type)?.label || selectedBlock.type}
              </p>
              <button onClick={() => setSelectedId(null)} className="text-gray-300 hover:text-gray-500">
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <BlockSettings
                block={selectedBlock}
                onChange={(updated) => editBlock(selectedBlock.id, updated)}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <Palette size={28} className="text-gray-200 mb-2" />
            <p className="text-xs text-gray-400">Block anklicken um ihn zu bearbeiten</p>
          </div>
        )}
      </div>
    </div>
  )
}
