import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  AlignJustify, List, ListOrdered, Image, Link, Code, Minus, Type,
} from 'lucide-react'

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']
const FONT_FAMILIES = [
  { label: 'Standard', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet', value: 'Trebuchet MS, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
]

function ToolbarBtn({ onClick, active, title, children, className = '' }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-200 transition-colors flex-shrink-0 ${active ? 'bg-gray-200 text-gray-900' : ''} ${className}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />
}

export default function RichEditor({ value, onChange }) {
  const editorRef = useRef(null)
  const fileRef = useRef(null)
  const [showSource, setShowSource] = useState(false)
  const [sourceValue, setSourceValue] = useState(value)
  const [activeFormats, setActiveFormats] = useState({})
  const [fontSize, setFontSize] = useState('14px')
  const [fontFamily, setFontFamily] = useState('')

  // Sync extern → editor (nur beim Mount)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [])

  const sync = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html)
      setSourceValue(html)
    }
  }, [onChange])

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
    })
  }

  const exec = (cmd, val = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    sync()
    updateActiveFormats()
  }

  const insertHTML = (html) => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, html)
    sync()
  }

  // Bild hochladen → base64 einbetten
  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = `<img src="${ev.target.result}" style="max-width:100%;height:auto;border-radius:4px;" />`
      insertHTML(img)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleLink = () => {
    const url = prompt('URL eingeben:', 'https://')
    if (url) exec('createLink', url)
  }

  const handleFontSize = (size) => {
    setFontSize(size)
    // execCommand fontSize nimmt 1-7, wir nutzen stattdessen span
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      exec('fontSize', '7')
      // Replace the giant font tags with span style
      editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
        const span = document.createElement('span')
        span.style.fontSize = size
        span.innerHTML = el.innerHTML
        el.replaceWith(span)
      })
      sync()
    }
  }

  const handleFontFamily = (family) => {
    setFontFamily(family)
    if (family) exec('fontName', family)
  }

  const handleColor = (e) => {
    exec('foreColor', e.target.value)
  }

  const handleBgColor = (e) => {
    exec('hiliteColor', e.target.value)
  }

  const handleSourceChange = (val) => {
    setSourceValue(val)
    onChange(val)
  }

  const toggleSource = () => {
    if (!showSource) {
      // Zu Source wechseln
      setSourceValue(editorRef.current?.innerHTML || '')
    } else {
      // Zurück zu Visual
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceValue
      }
    }
    setShowSource(v => !v)
  }

  const insertHr = () => insertHTML('<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />')

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">

        {/* Font Family */}
        <select
          value={fontFamily}
          onChange={e => handleFontFamily(e.target.value)}
          className="h-7 px-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none mr-1"
        >
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={e => handleFontSize(e.target.value)}
          className="h-7 px-1.5 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg focus:outline-none mr-1"
        >
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <Divider />

        <ToolbarBtn onClick={() => exec('bold')} active={activeFormats.bold} title="Fett (⌘B)">
          <Bold size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} active={activeFormats.italic} title="Kursiv (⌘I)">
          <Italic size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} active={activeFormats.underline} title="Unterstrichen (⌘U)">
          <Underline size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('strikeThrough')} active={activeFormats.strikeThrough} title="Durchgestrichen">
          <Strikethrough size={13} />
        </ToolbarBtn>

        <Divider />

        {/* Textfarbe */}
        <div className="relative flex-shrink-0" title="Textfarbe">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
            <Type size={13} className="text-gray-600" />
            <input
              type="color"
              defaultValue="#000000"
              onChange={handleColor}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Textfarbe"
            />
          </div>
        </div>

        {/* Hintergrundfarbe */}
        <div className="relative flex-shrink-0" title="Hintergrundfarbe">
          <div className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
            <span className="text-xs font-bold text-gray-600">A</span>
            <div className="absolute bottom-1 left-1 right-1 h-1 rounded-full bg-yellow-300" />
            <input
              type="color"
              defaultValue="#ffff00"
              onChange={handleBgColor}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Hintergrundfarbe"
            />
          </div>
        </div>

        <Divider />

        <ToolbarBtn onClick={() => exec('justifyLeft')} active={activeFormats.justifyLeft} title="Linksbündig">
          <AlignLeft size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyCenter')} active={activeFormats.justifyCenter} title="Zentriert">
          <AlignCenter size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyRight')} active={activeFormats.justifyRight} title="Rechtsbündig">
          <AlignRight size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('justifyFull')} title="Blocksatz">
          <AlignJustify size={13} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => exec('insertUnorderedList')} active={activeFormats.insertUnorderedList} title="Aufzählungsliste">
          <List size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => exec('insertOrderedList')} active={activeFormats.insertOrderedList} title="Nummerierte Liste">
          <ListOrdered size={13} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={handleLink} title="Link einfügen">
          <Link size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => fileRef.current?.click()} title="Bild hochladen">
          <Image size={13} />
        </ToolbarBtn>
        <ToolbarBtn onClick={insertHr} title="Trennlinie">
          <Minus size={13} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={toggleSource} active={showSource} title="HTML Quellcode">
          <Code size={13} />
        </ToolbarBtn>
      </div>

      {/* Editor / Source */}
      {showSource ? (
        <textarea
          value={sourceValue}
          onChange={e => handleSourceChange(e.target.value)}
          className="w-full px-4 py-3 text-xs font-mono text-gray-700 focus:outline-none resize-none bg-gray-950 text-green-400"
          style={{ minHeight: 320 }}
          spellCheck={false}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          className="px-5 py-4 text-sm text-gray-800 focus:outline-none"
          style={{
            minHeight: 320,
            lineHeight: '1.7',
            wordBreak: 'break-word',
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  )
}
