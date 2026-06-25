import { useState, useEffect } from 'react'
import { Minus, Square, X } from 'lucide-react'

export default function WindowsTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.electronAPI.windowIsMaximized().then(setIsMaximized)
    window.electronAPI.onWindowMaximized(setIsMaximized)
  }, [])

  return (
    <div
      className="flex items-center justify-between bg-white border-b border-gray-200 flex-shrink-0"
      style={{ height: 32, WebkitAppRegion: 'drag' }}
    >
      <span
        className="text-xs font-semibold text-gray-500 px-4 select-none"
        style={{ WebkitAppRegion: 'drag' }}
      >
        Aku CRM
      </span>
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.electronAPI.windowMinimize()}
          className="w-12 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.electronAPI.windowMaximize()}
          className="w-12 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => window.electronAPI.windowClose()}
          className="w-12 h-8 flex items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
