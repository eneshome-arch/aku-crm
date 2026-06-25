import { useState, useEffect } from 'react'
import { X, Mail, CheckCircle, XCircle, Eye, EyeOff, ChevronDown } from 'lucide-react'

const PROVIDERS = [
  {
    label: 'Microsoft Outlook / Hotmail',
    value: 'outlook',
    host: 'smtp-mail.outlook.com',
    port: 587,
  },
  {
    label: 'Office 365 / Microsoft 365',
    value: 'office365',
    host: 'smtp.office365.com',
    port: 587,
  },
  {
    label: 'Gmail',
    value: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    hint: 'Bei Gmail ein App-Passwort unter myaccount.google.com → Sicherheit erstellen.',
  },
  {
    label: 'GMX',
    value: 'gmx',
    host: 'mail.gmx.net',
    port: 587,
  },
  {
    label: 'Web.de',
    value: 'webde',
    host: 'smtp.web.de',
    port: 587,
  },
  {
    label: 'Eigener SMTP-Server',
    value: 'custom',
    host: '',
    port: 587,
  },
]

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"

export default function EmailSettings({ onClose }) {
  const [provider, setProvider] = useState('outlook')
  const [config, setConfig] = useState({
    host: 'smtp-mail.outlook.com',
    port: 587,
    email: '',
    password: '',
    senderName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    window.electronAPI.getSettings().then(s => {
      if (s.emailConfig) {
        setConfig(s.emailConfig)
        const p = PROVIDERS.find(p => p.host === s.emailConfig.host)
        if (p) setProvider(p.value)
        else setProvider('custom')
      }
    })
  }, [])

  const handleProviderChange = (val) => {
    setProvider(val)
    const p = PROVIDERS.find(p => p.value === val)
    if (p) setConfig(c => ({ ...c, host: p.host, port: p.port }))
    setTestResult(null)
  }

  const set = (field) => (e) => {
    setConfig(c => ({ ...c, [field]: e.target.value }))
    setTestResult(null)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    const res = await window.electronAPI.testEmail(config)
    setTesting(false)
    setTestResult(res)
  }

  const handleSave = async () => {
    setSaving(true)
    await window.electronAPI.setSetting('emailConfig', config)
    setSaving(false)
    onClose()
  }

  const selectedProvider = PROVIDERS.find(p => p.value === provider)

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">E-Mail Konto verbinden</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Provider */}
          <Field label="E-Mail Anbieter">
            <div className="relative">
              <select
                value={provider}
                onChange={e => handleProviderChange(e.target.value)}
                className={inputClass + ' appearance-none pr-8'}
              >
                {PROVIDERS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {selectedProvider?.hint && (
              <p className="text-xs text-amber-600 mt-1.5 bg-amber-50 px-3 py-2 rounded-xl">{selectedProvider.hint}</p>
            )}
          </Field>

          {/* Custom SMTP */}
          {provider === 'custom' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">SMTP Host</label>
                <input type="text" value={config.host} onChange={set('host')} placeholder="mail.example.com" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Port</label>
                <input type="number" value={config.port} onChange={e => setConfig(c => ({ ...c, port: Number(e.target.value) }))} className={inputClass} />
              </div>
            </div>
          )}

          <Field label="Absender Name">
            <input type="text" value={config.senderName} onChange={set('senderName')} placeholder="Max Mustermann" className={inputClass} />
          </Field>

          <Field label="E-Mail Adresse">
            <input type="email" value={config.email} onChange={set('email')} placeholder="deine@email.de" className={inputClass} />
          </Field>

          <Field label="Passwort">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={config.password}
                onChange={set('password')}
                placeholder="••••••••"
                className={inputClass + ' pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          {/* Test Ergebnis */}
          {testResult && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium mb-2 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {testResult.success
                ? <><CheckCircle size={16} /> Verbindung erfolgreich!</>
                : <><XCircle size={16} /> {testResult.error}</>
              }
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={testing || !config.email || !config.password}
            className="w-full py-2.5 text-sm font-medium border-2 border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-40 rounded-xl transition-colors flex items-center justify-center gap-2 mb-2"
          >
            {testing ? (
              <><div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div> Verbindung testen...</>
            ) : (
              <><Mail size={15} /> Verbindung testen</>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !config.email || !config.password}
            className="px-5 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl transition-colors"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
