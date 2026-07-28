import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, FileText, Trash2, Download, Save, Eye, Edit3, ChevronLeft, X, Search, UserCheck, RefreshCw } from 'lucide-react'

const STATUS_LABELS = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-600' },
  verschickt: { label: 'Verschickt', color: 'bg-blue-100 text-blue-700' },
  angenommen: { label: 'Angenommen', color: 'bg-green-100 text-green-700' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700' },
}

const EINRICHTUNG_TYPEN = {
  pflegeheim: {
    label: '\u{1F3E0} Pflegeheim / Seniorenzentrum',
    pricing: [
      { qualifikation: 'Examinierte Pflegefachkraft', badge: '3-j\u00e4hrig examiniert', badgeColor: 'green', einsatz: 'Grund- & Behandlungspflege', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-j\u00e4hrig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Hauswirtschaftskraft', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Hauswirtschaft, Versorgung', preis: '29,30' },
    ],
  },
  krankenhaus: {
    label: '\u{1F3E5} Krankenhaus / Klinik',
    pricing: [
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-j\u00e4hrig examiniert', badgeColor: 'green', einsatz: 'Stationspflege, Akutversorgung', preis: '54,50' },
      { qualifikation: 'Krankenpflegehelfer/in', badge: '1-j\u00e4hrig', badgeColor: 'blue', einsatz: 'Grundpflege, Stationsunterst\u00fctzung', preis: '38,00' },
      { qualifikation: 'Stationshilfe', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Versorgung, Servicet\u00e4tigkeiten', preis: '29,30' },
    ],
  },
  ambulant: {
    label: '\u{1F697} Ambulanter Pflegedienst',
    pricing: [
      { qualifikation: 'Pflegefachkraft ambulant', badge: '3-j\u00e4hrig examiniert', badgeColor: 'green', einsatz: 'Behandlungs- & Grundpflege, Touren', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-j\u00e4hrig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Alltagsbegleiter/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Betreuung, hauswirtsch. Versorgung', preis: '27,00' },
    ],
  },
  reha: {
    label: '\u{1F3CB}\uFE0F Reha-Klinik',
    pricing: [
      { qualifikation: 'Pflegefachkraft', badge: '3-j\u00e4hrig examiniert', badgeColor: 'green', einsatz: 'Pflegeprozess, Patientenbetreuung', preis: '51,80' },
      { qualifikation: 'Therapeutische Fachkraft', badge: 'Fachqualifikation', badgeColor: 'blue', einsatz: 'Unterst\u00fctzung Therapiema\u00dfnahmen', preis: '48,00' },
      { qualifikation: 'Pflegehilfskraft', badge: 'Helfer', badgeColor: 'gray', einsatz: 'Grundpflege, Servicet\u00e4tigkeiten', preis: '36,60' },
    ],
  },
  psychiatrie: {
    label: '\u{1F9E0} Psychiatrie / Sozialpsychiatrie',
    pricing: [
      { qualifikation: 'Psychiatriefachpfleger/in', badge: 'Fachweiterbildung', badgeColor: 'green', einsatz: 'Psychiatrische Stationspflege', preis: '54,50' },
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-j\u00e4hrig examiniert', badgeColor: 'blue', einsatz: 'Allgemeinpflege, Betreuung', preis: '51,80' },
      { qualifikation: 'Sozialp\u00e4dagoge/in', badge: 'B.A. / Diplom', badgeColor: 'gray', einsatz: 'Soziale Begleitung, Gruppenarbeit', preis: '48,00' },
    ],
  },
  eingliederung: {
    label: '\u267F Behinderteneinrichtung / Eingliederungshilfe',
    pricing: [
      { qualifikation: 'Heilerziehungspfleger/in', badge: '3-j\u00e4hrig examiniert', badgeColor: 'green', einsatz: 'P\u00e4dagogische Betreuung, Pflege', preis: '51,80' },
      { qualifikation: 'Sozialp\u00e4dagoge/in', badge: 'B.A. / Diplom', badgeColor: 'blue', einsatz: 'Soziale Arbeit, Gruppenleitung', preis: '48,00' },
      { qualifikation: 'Betreuungshelfer/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Alltagsbegleitung, Assistenz', preis: '33,00' },
    ],
  },
}

const DEFAULT_LEISTUNGSBESCHREIBUNG = 'Der Auftragnehmer \u00fcberl\u00e4sst dem Auftraggeber qualifiziertes Personal im Bereich der Pflege und Betreuung gem\u00e4\u00df den Bestimmungen des Arbeitnehmer\u00fcberlassungsgesetzes (A\u00dcG).'

function newRahmenvertrag(typ = 'pflegeheim') {
  const t = EINRICHTUNG_TYPEN[typ]
  const today = new Date()
  return {
    id: null,
    contactId: null,
    einrichtungsTyp: typ,
    recipientName: '',
    recipientCompany: '',
    recipientAddress: '',
    offerNumber: '',
    date: today.toISOString().slice(0, 10),
    vertragsbeginn: today.toISOString().slice(0, 10),
    vertragslaufzeit: 'unbefristet',
    kuendigungsfrist: '4 Wochen',
    leistungsbeschreibung: DEFAULT_LEISTUNGSBESCHREIBUNG,
    pricing: t.pricing.map(r => ({ ...r })),
    zuschlaege: { ueberstunden: 25, nacht: 35, sonntag: 60, feiertag: 110 },
    zahlungsziel: '14 Tage',
    abrechnungsintervall: 'W\u00f6chentlich',
    besondereVereinbarungen: '',
    status: 'entwurf',
    notes: '',
  }
}

function formatDateDE(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function generateHTML(rv, company = {}) {
  const c = {
    name: company.companyName || 'Zeitblick Personalservice',
    logo: company.logo || '',
    accentColor: company.accentColor || '#1e40af',
    address: [company.address, [company.postalCode, company.city].filter(Boolean).join(' ')].filter(Boolean).join(' \u00b7 ') || 'Vahrenwalder Str. 255 \u00b7 30179 Hannover',
    phone: company.phone || '0163 \u2013 864 4309',
    email: company.email || 'info@zeitblick-personal.de',
    website: company.website || 'www.zeitblick-personal.de',
    footerText: company.footerText || '',
    contactPerson: company.contactPerson || '',
    ustId: company.ustId || '',
    city: company.city || 'Hannover',
  }

  const badgeColors = {
    green: 'background:#dcfce7;color:#166534',
    blue: 'background:#dbeafe;color:#1d4ed8',
    gray: 'background:#f1f5f9;color:#475569',
  }

  const pricingRows = rv.pricing.map(row => `
    <tr>
      <td style="padding:10px 16px;font-size:9.5pt;color:#1e293b;vertical-align:middle;border-bottom:1px solid #f1f5f9">
        ${row.qualifikation}
        <span style="display:inline-block;${badgeColors[row.badgeColor] || badgeColors.blue};font-size:7pt;font-weight:600;padding:2px 8px;border-radius:100px;margin-left:6px;vertical-align:middle">${row.badge}</span>
      </td>
      <td style="padding:10px 16px;font-size:9.5pt;color:#1e293b;vertical-align:middle;border-bottom:1px solid #f1f5f9">${row.einsatz}</td>
      <td style="padding:10px 16px;font-size:10.5pt;font-weight:700;color:#0f172a;text-align:right;vertical-align:middle;border-bottom:1px solid #f1f5f9">${row.preis} \u20ac</td>
    </tr>
  `).join('')

  const recipientLines = [
    rv.recipientCompany,
    rv.recipientName ? 'z. Hd. ' + rv.recipientName : '',
    rv.recipientAddress,
  ].filter(Boolean).join('<br>')

  const zuschlaege = rv.zuschlaege || { ueberstunden: 25, nacht: 35, sonntag: 60, feiertag: 110 }

  const laufzeitText = rv.vertragslaufzeit === 'unbefristet'
    ? 'auf unbestimmte Zeit (unbefristet)'
    : `f\u00fcr die Dauer von ${rv.vertragslaufzeit}`

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Rahmenvertrag \u2013 ${c.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:10pt; color:#1e293b; background:#fff; line-height:1.6; }
    .page { width:210mm; min-height:297mm; margin:0 auto; background:#fff; display:flex; flex-direction:column; }
    .header { background:#0f172a; padding:26px 40px 22px; display:flex; justify-content:space-between; align-items:flex-end; }
    .header-logo img { height:40px; width:auto; display:block; }
    .header-tagline { font-size:8pt; color:rgba(255,255,255,0.45); letter-spacing:0.12em; text-transform:uppercase; margin-top:7px; }
    .header-contact { text-align:right; }
    .header-contact p { font-size:8.5pt; color:rgba(255,255,255,0.6); line-height:1.7; }
    .header-contact strong { color:rgba(255,255,255,0.9); font-weight:500; }
    .accent-bar { height:3px; background:linear-gradient(to right,${c.accentColor},#06b6d4); }
    .body { padding:20px 40px 24px; flex:1; }
    .contract-title { text-align:center; font-size:16pt; font-weight:700; color:#0f172a; margin:10px 0 6px; letter-spacing:-0.3px; }
    .contract-subtitle { text-align:center; font-size:9pt; color:#64748b; margin-bottom:20px; }
    .parties { display:flex; gap:30px; margin-bottom:18px; padding-bottom:14px; border-bottom:1px solid #e2e8f0; }
    .party { flex:1; }
    .party-label { font-size:7.5pt; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; margin-bottom:5px; }
    .party-content { font-size:9.5pt; color:#1e293b; line-height:1.6; }
    .party-content strong { font-weight:600; color:#0f172a; }
    .paragraph { margin-bottom:14px; }
    .paragraph-title { font-size:10.5pt; font-weight:700; color:${c.accentColor}; margin-bottom:6px; padding-bottom:4px; border-bottom:2px solid #e2e8f0; }
    .paragraph-text { font-size:9.5pt; color:#334155; line-height:1.65; }
    .paragraph-text p { margin-bottom:5px; }
    .pricing-table { width:100%; border-collapse:collapse; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); margin:8px 0; }
    .pricing-table thead tr { background:#0f172a; }
    .pricing-table thead th { padding:10px 16px; text-align:left; font-size:8pt; font-weight:600; color:rgba(255,255,255,0.7); letter-spacing:0.06em; text-transform:uppercase; }
    .pricing-table thead th:last-child { text-align:right; }
    .pricing-table tbody tr:nth-child(even) { background:#f8fafc; }
    .price-note { font-size:7.5pt; color:#94a3b8; text-align:right; margin-top:4px; }
    .surcharge-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin:8px 0; }
    .surcharge-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:9px 13px; display:flex; justify-content:space-between; align-items:center; }
    .surcharge-label { font-size:9pt; color:#475569; }
    .surcharge-label small { display:block; font-size:7.5pt; color:#94a3b8; margin-top:1px; }
    .surcharge-value { font-size:10pt; font-weight:700; color:#0f172a; }
    .terms-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin:8px 0; }
    .term-item { padding:9px 13px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
    .term-label { font-size:7.5pt; font-weight:600; color:#94a3b8; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:2px; }
    .term-value { font-size:9pt; color:#1e293b; line-height:1.5; }
    .signature-section { margin-top:30px; padding-top:18px; border-top:2px solid #e2e8f0; }
    .signature-row { display:flex; gap:40px; margin-top:20px; }
    .signature-block { flex:1; }
    .sig-line { border-bottom:1px solid #1e293b; margin-bottom:4px; height:50px; }
    .sig-caption { font-size:8pt; color:#64748b; }
    .sig-subcaption { font-size:7.5pt; color:#94a3b8; margin-top:1px; }
    .meta-info { font-size:8.5pt; color:#64748b; margin-bottom:3px; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:11px 40px; display:flex; justify-content:space-between; align-items:center; margin-top:auto; }
    .footer p { font-size:7.5pt; color:#94a3b8; line-height:1.6; }
    .footer .footer-brand { font-weight:700; color:#475569; font-size:8pt; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page { margin:0; width:100%; } @page { margin:0; size:A4; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="header-logo">
        ${c.logo ? `<img src="${c.logo}" alt="${c.name}" style="height:40px;width:auto;display:block">` : `<span style="color:white;font-size:18pt;font-weight:700;letter-spacing:-0.5px">${c.name}</span>`}
      </div>
      <div class="header-tagline">${c.name.split(' ')[0]} \u00b7 ${c.city}</div>
    </div>
    <div class="header-contact">
      ${c.contactPerson ? `<p><strong>${c.contactPerson}</strong></p>` : ''}
      <p>Tel. ${c.phone}</p>
      <p>${c.email}</p>
      <p>${c.website}</p>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">
    <div class="contract-title">Rahmenvertrag zur Arbeitnehmer\u00fcberlassung</div>
    <div class="contract-subtitle">Vertragsnr. ${rv.offerNumber || 'RV-2026-XXX'} \u00b7 ${c.city}, ${formatDateDE(rv.date)}</div>

    <div class="parties">
      <div class="party">
        <div class="party-label">Auftragnehmer</div>
        <div class="party-content">
          <strong>${c.name}</strong><br>
          ${c.address}<br>
          ${c.contactPerson ? c.contactPerson + '<br>' : ''}
          Tel. ${c.phone}<br>
          ${c.email}
        </div>
      </div>
      <div class="party">
        <div class="party-label">Auftraggeber</div>
        <div class="party-content">
          ${recipientLines || '<span style="color:#94a3b8;font-style:italic">[Auftraggeber]</span>'}
        </div>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 1 Vertragsgegenstand</div>
      <div class="paragraph-text">
        <p>Gegenstand dieses Rahmenvertrags ist die Arbeitnehmer\u00fcberlassung gem\u00e4\u00df dem Arbeitnehmer\u00fcberlassungsgesetz (A\u00dcG). Der Auftragnehmer verpflichtet sich, dem Auftraggeber qualifiziertes Personal zur Arbeitsleistung zu \u00fcberlassen. Die konkreten Eins\u00e4tze werden jeweils durch einzelne Anforderungen geregelt.</p>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 2 Leistungsumfang</div>
      <div class="paragraph-text">
        <p>${rv.leistungsbeschreibung || DEFAULT_LEISTUNGSBESCHREIBUNG}</p>
        <p>Die \u00dcberlassung erfolgt auf Grundlage der jeweils geltenden gesetzlichen Bestimmungen, insbesondere des A\u00dcG in seiner aktuellen Fassung.</p>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 3 Verg\u00fctung</div>
      <div class="paragraph-text">
        <p>Die Verg\u00fctung richtet sich nach den folgenden Stundenverrechnungss\u00e4tzen:</p>
      </div>
      <table class="pricing-table">
        <thead><tr>
          <th style="width:55%">Qualifikation (m/w/d)</th>
          <th>Einsatzbereich</th>
          <th>Stundensatz</th>
        </tr></thead>
        <tbody>${pricingRows}</tbody>
      </table>
      <div class="price-note">Alle Preise in Euro netto \u00b7 zzgl. der zum Zeitpunkt der Rechnungsstellung g\u00fcltigen gesetzlichen MwSt.</div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 4 Zuschl\u00e4ge</div>
      <div class="paragraph-text"><p>F\u00fcr folgende Leistungen werden prozentuale Zuschl\u00e4ge auf den jeweiligen Stundensatz erhoben:</p></div>
      <div class="surcharge-grid">
        <div class="surcharge-item"><div class="surcharge-label">\u00dcberstunden<small>ab der 40,01. Wochenstunde</small></div><div class="surcharge-value">+ ${zuschlaege.ueberstunden} %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Nachtzuschlag<small>23:00 \u2013 06:00 Uhr</small></div><div class="surcharge-value">+ ${zuschlaege.nacht} %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Sonntagszuschlag<small>alle Stunden am Sonntag</small></div><div class="surcharge-value">+ ${zuschlaege.sonntag} %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Feiertagszuschlag<small>alle Stunden an Feiertagen</small></div><div class="surcharge-value">+ ${zuschlaege.feiertag} %</div></div>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 5 Zahlungsbedingungen</div>
      <div class="terms-grid">
        <div class="term-item"><div class="term-label">Abrechnungsintervall</div><div class="term-value">${rv.abrechnungsintervall || 'W\u00f6chentlich'} auf Basis gegengezeichneter Arbeitsstundennachweise</div></div>
        <div class="term-item"><div class="term-label">Zahlungsziel</div><div class="term-value">${rv.zahlungsziel || '14 Tage'} nach Rechnungseingang, netto ohne Abzug</div></div>
        <div class="term-item"><div class="term-label">Zahlungsart</div><div class="term-value">Bargeldlose \u00dcberweisung</div></div>
        <div class="term-item"><div class="term-label">Grundlage</div><div class="term-value">AGB ${c.name} \u00b7 Arbeitnehmer\u00fcberlassungsgesetz (A\u00dcG)</div></div>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 6 Vertragslaufzeit</div>
      <div class="paragraph-text">
        <p>Dieser Rahmenvertrag wird ${laufzeitText} geschlossen. Er beginnt am ${formatDateDE(rv.vertragsbeginn)}.</p>
      </div>
    </div>

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 7 K\u00fcndigung</div>
      <div class="paragraph-text">
        <p>Der Vertrag kann von jeder Vertragspartei mit einer Frist von ${rv.kuendigungsfrist || '4 Wochen'} zum Monatsende schriftlich gek\u00fcndigt werden. Das Recht zur au\u00dferordentlichen K\u00fcndigung aus wichtigem Grund bleibt unber\u00fchrt.</p>
      </div>
    </div>

    ${rv.besondereVereinbarungen ? `
    <div class="paragraph">
      <div class="paragraph-title">\u00a7 8 Besondere Vereinbarungen</div>
      <div class="paragraph-text">
        <p>${rv.besondereVereinbarungen.replace(/\n/g, '<br>')}</p>
      </div>
    </div>
    ` : ''}

    <div class="paragraph">
      <div class="paragraph-title">\u00a7 ${rv.besondereVereinbarungen ? '9' : '8'} Schlussbestimmungen</div>
      <div class="paragraph-text">
        <p>\u00c4nderungen und Erg\u00e4nzungen dieses Vertrags bed\u00fcrfen der Schriftform. Sollte eine Bestimmung dieses Vertrags unwirksam sein oder werden, bleibt die Wirksamkeit der \u00fcbrigen Bestimmungen davon unber\u00fchrt. Gerichtsstand ist ${c.city}.</p>
        <p>Es gilt das Recht der Bundesrepublik Deutschland. Nebenabreden wurden nicht getroffen.</p>
      </div>
    </div>

    <div class="signature-section">
      <div class="meta-info">${c.city}, den ${formatDateDE(rv.date)}</div>
      <div class="signature-row">
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-caption">Auftragnehmer: ${c.name}</div>
          <div class="sig-subcaption">${c.contactPerson || 'Gesch\u00e4ftsf\u00fchrung'}</div>
        </div>
        <div class="signature-block">
          <div class="sig-line"></div>
          <div class="sig-caption">Auftraggeber: ${rv.recipientCompany || '[Unternehmen]'}</div>
          <div class="sig-subcaption">${rv.recipientName || 'Bevollm\u00e4chtigte/r'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <div><p class="footer-brand">${c.name}</p><p>${c.address}</p></div>
    <div style="text-align:center"><p>Tel. ${c.phone}</p><p>${c.email}</p></div>
    <div style="text-align:right"><p>${c.website}</p>${c.ustId ? `<p>USt-IdNr. ${c.ustId}</p>` : ''}</div>
  </div>
</div>
</body>
</html>`
}

export default function RahmenvertragModule({ currentUser }) {
  const [offers, setOffers] = useState([])
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('editor')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [companyProfile, setCompanyProfile] = useState({})
  const contactSearchRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOffers = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await window.electronAPI.offersList(currentUser.id)
    if (res.success) {
      // Filter to only show rahmenvertrag documents
      setOffers((res.offers || []).filter(o => o.doc_type === 'rahmenvertrag'))
    }
  }, [currentUser])

  const loadContacts = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await window.electronAPI.query(
      `SELECT id, company_name, first_name, last_name, address, city, postal_code FROM contacts WHERE user_id=$1 ORDER BY company_name ASC`,
      [currentUser.id]
    )
    if (res.rows) setContacts(res.rows)
  }, [currentUser])

  useEffect(() => {
    loadOffers()
    loadContacts()
    async function loadCompany() {
      const s = await window.electronAPI?.getSettings?.()
      if (s?.companyProfile) setCompanyProfile(s.companyProfile)
    }
    loadCompany()
  }, [loadOffers, loadContacts])

  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase()
    return !q || c.company_name?.toLowerCase().includes(q) ||
      `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase().includes(q)
  })

  const handlePickContact = (contact) => {
    const nameParts = [contact.first_name, contact.last_name].filter(Boolean)
    const adressParts = [contact.address, [contact.postal_code, contact.city].filter(Boolean).join(' ')].filter(Boolean)
    setSelected(s => ({
      ...s,
      contactId: contact.id,
      recipientName: nameParts.join(' '),
      recipientCompany: contact.company_name || '',
      recipientAddress: adressParts.join(', '),
    }))
    setContactSearch('')
    setShowContactDropdown(false)
  }

  const handleTypeChange = (typ) => {
    const t = EINRICHTUNG_TYPEN[typ]
    if (!t) return
    setSelected(s => ({
      ...s,
      einrichtungsTyp: typ,
      pricing: t.pricing.map(r => ({ ...r })),
    }))
  }

  const handleNew = () => {
    setSelected(newRahmenvertrag('pflegeheim'))
    setTab('editor')
  }

  const handleSelectOffer = (o) => {
    const items = Array.isArray(o.items) ? o.items : []
    const typ = o.template && EINRICHTUNG_TYPEN[o.template] ? o.template : 'pflegeheim'
    const t = EINRICHTUNG_TYPEN[typ]

    // Parse intro_text as JSON for rahmenvertrag-specific fields
    let contractData = {}
    if (o.intro_text) {
      try {
        contractData = JSON.parse(o.intro_text)
      } catch {
        contractData = {}
      }
    }

    const toDateStr = (val) => {
      if (!val) return ''
      if (typeof val === 'string') return val.slice(0, 10)
      return new Date(val).toISOString().slice(0, 10)
    }

    setSelected({
      id: o.id,
      contactId: o.contact_id || null,
      einrichtungsTyp: typ,
      recipientName: contractData.recipientName || '',
      recipientCompany: contractData.recipientCompany || o.title || '',
      recipientAddress: contractData.recipientAddress || '',
      offerNumber: o.offer_number || '',
      date: toDateStr(o.created_at) || new Date().toISOString().slice(0, 10),
      vertragsbeginn: contractData.vertragsbeginn || toDateStr(o.created_at) || new Date().toISOString().slice(0, 10),
      vertragslaufzeit: contractData.vertragslaufzeit || 'unbefristet',
      kuendigungsfrist: contractData.kuendigungsfrist || '4 Wochen',
      leistungsbeschreibung: contractData.leistungsbeschreibung || DEFAULT_LEISTUNGSBESCHREIBUNG,
      pricing: items.length ? items : t.pricing.map(r => ({ ...r })),
      zuschlaege: contractData.zuschlaege || { ueberstunden: 25, nacht: 35, sonntag: 60, feiertag: 110 },
      zahlungsziel: contractData.zahlungsziel || '14 Tage',
      abrechnungsintervall: contractData.abrechnungsintervall || 'W\u00f6chentlich',
      besondereVereinbarungen: contractData.besondereVereinbarungen || '',
      status: o.status || 'entwurf',
      notes: o.notes || '',
    })
    setTab('editor')
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const introText = JSON.stringify({
        recipientName: selected.recipientName,
        recipientCompany: selected.recipientCompany,
        recipientAddress: selected.recipientAddress,
        vertragsbeginn: selected.vertragsbeginn,
        vertragslaufzeit: selected.vertragslaufzeit,
        kuendigungsfrist: selected.kuendigungsfrist,
        leistungsbeschreibung: selected.leistungsbeschreibung,
        zuschlaege: selected.zuschlaege,
        zahlungsziel: selected.zahlungsziel,
        abrechnungsintervall: selected.abrechnungsintervall,
        besondereVereinbarungen: selected.besondereVereinbarungen,
      })
      const res = await window.electronAPI.offersSave({
        id: selected.id,
        userId: currentUser.id,
        contactId: selected.contactId || null,
        docType: 'rahmenvertrag',
        offerNumber: selected.offerNumber,
        title: selected.recipientCompany || selected.recipientName || 'Rahmenvertrag',
        items: selected.pricing,
        notes: selected.notes,
        taxRate: 19,
        subtotal: 0, taxAmount: 0, total: 0,
        status: selected.status,
        validUntil: null,
        dueDate: null,
        serviceLocation: '',
        processor: 'Enes Cansever',
        introText,
        template: selected.einrichtungsTyp,
      })
      if (res.success) {
        if (!selected.id) setSelected(s => ({ ...s, id: res.id, offerNumber: res.offerNumber || s.offerNumber }))
        await loadOffers()
        showToast('Rahmenvertrag gespeichert')
      } else {
        showToast(res.error || 'Fehler beim Speichern', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (offerId) => {
    if (!confirm('Rahmenvertrag l\u00f6schen?')) return
    const res = await window.electronAPI.offersDelete(offerId, currentUser.id)
    if (res.success) {
      await loadOffers()
      if (selected?.id === offerId) setSelected(null)
      showToast('Rahmenvertrag gel\u00f6scht')
    }
  }

  const handleExportPdf = async () => {
    if (!selected) return
    setExporting(true)
    try {
      const html = generateHTML(selected, companyProfile)
      const filename = `Rahmenvertrag_${selected.recipientCompany || 'Zeitblick'}_${selected.offerNumber || new Date().toISOString().slice(0, 10)}.pdf`
      const res = await window.electronAPI.offersExportPdf({ html, filename })
      if (res.success) showToast('PDF gespeichert und ge\u00f6ffnet')
      else if (res.error !== 'Abgebrochen') showToast(res.error || 'PDF-Fehler', 'error')
    } finally {
      setExporting(false)
    }
  }

  const updateField = (field, value) => setSelected(s => ({ ...s, [field]: value }))
  const updatePricingRow = (idx, field, value) => setSelected(s => ({
    ...s,
    pricing: s.pricing.map((r, i) => i === idx ? { ...r, [field]: value } : r),
  }))
  const updateZuschlag = (key, value) => setSelected(s => ({
    ...s,
    zuschlaege: { ...s.zuschlaege, [key]: Number(value) || 0 },
  }))

  return (
    <div className="flex h-full bg-gray-50">
      {/* LEFT */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Rahmenvertr\u00e4ge</h2>
          <button onClick={handleNew} className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors" title="Neuer Rahmenvertrag">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {offers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              Noch keine Rahmenvertr\u00e4ge
            </div>
          ) : offers.map(o => {
            const st = STATUS_LABELS[o.status] || STATUS_LABELS.entwurf
            return (
              <button key={o.id} onClick={() => handleSelectOffer(o)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all group ${selected?.id === o.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate">{o.title || 'Ohne Titel'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{o.offer_number}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); handleDelete(o.id) }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
                <span className={`mt-1.5 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* RIGHT */}
      {!selected ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Rahmenvertrag ausw\u00e4hlen oder neu erstellen</p>
            <button onClick={handleNew} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors">Neuer Rahmenvertrag</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-gray-800 text-sm">{selected.recipientCompany || selected.recipientName || 'Neuer Rahmenvertrag'}</span>
              {selected.id && <span className="text-xs text-gray-400">{selected.offerNumber}</span>}
            </div>
            <div className="flex items-center gap-2">
              <select value={selected.status} onChange={e => updateField('status', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setTab('editor')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'editor' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Edit3 size={12} /> Bearbeiten
                </button>
                <button onClick={() => setTab('preview')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'preview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Eye size={12} /> Vorschau
                </button>
              </div>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Save size={12} />{saving ? 'Speichern\u2026' : 'Speichern'}
              </button>
              <button onClick={handleExportPdf} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Download size={12} />{exporting ? 'Exportiere\u2026' : 'Als PDF'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'editor' ? (
              <div className="max-w-2xl mx-auto p-6 space-y-6">

                {/* Einrichtungstyp */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Einrichtungstyp</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(EINRICHTUNG_TYPEN).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => handleTypeChange(key)}
                        className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                          selected.einrichtungsTyp === key
                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium ring-1 ring-blue-300'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <RefreshCw size={10} /> Beim Wechsel werden die Stundensätze automatisch angepasst.
                  </p>
                </section>

                {/* Vertragspartner */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vertragspartner</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><UserCheck size={11} /> Aus Kontakten übernehmen</label>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input ref={contactSearchRef} type="text" value={contactSearch}
                          onChange={e => { setContactSearch(e.target.value); setShowContactDropdown(true) }}
                          onFocus={() => setShowContactDropdown(true)}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="Kontakt suchen und ausw\u00e4hlen\u2026"
                          className="w-full pl-8 pr-3 py-2 border border-blue-200 bg-blue-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                      </div>
                      {showContactDropdown && filteredContacts.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filteredContacts.slice(0, 20).map(c => (
                            <button key={c.id} onMouseDown={() => handlePickContact(c)}
                              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0">
                              <p className="text-sm font-medium text-gray-800">{c.company_name}</p>
                              {(c.first_name || c.last_name) && <p className="text-xs text-gray-500">{[c.first_name, c.last_name].filter(Boolean).join(' ')}</p>}
                              {c.city && <p className="text-xs text-gray-400">{[c.postal_code, c.city].filter(Boolean).join(' ')}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Ansprechpartner</label>
                        <input type="text" value={selected.recipientName} onChange={e => updateField('recipientName', e.target.value)} placeholder="z. B. Frau M\u00fcller" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Unternehmen</label>
                        <input type="text" value={selected.recipientCompany} onChange={e => updateField('recipientCompany', e.target.value)} placeholder="z. B. Diakovere Annastift" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Adresse</label>
                        <input type="text" value={selected.recipientAddress} onChange={e => updateField('recipientAddress', e.target.value)} placeholder="z. B. Musterstra\u00dfe 12, 30159 Hannover" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Vertragsdaten */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Vertragsdaten</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vertragsnummer</label>
                      <input type="text" value={selected.offerNumber} onChange={e => updateField('offerNumber', e.target.value)} placeholder="RV-2026-001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vertragsbeginn</label>
                      <input type="date" value={selected.vertragsbeginn} onChange={e => updateField('vertragsbeginn', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vertragslaufzeit</label>
                      <select value={selected.vertragslaufzeit} onChange={e => updateField('vertragslaufzeit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="unbefristet">Unbefristet</option>
                        <option value="6 Monate">6 Monate</option>
                        <option value="12 Monate">12 Monate</option>
                        <option value="24 Monate">24 Monate</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">K\u00fcndigungsfrist</label>
                      <select value={selected.kuendigungsfrist} onChange={e => updateField('kuendigungsfrist', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="4 Wochen">4 Wochen</option>
                        <option value="6 Wochen">6 Wochen</option>
                        <option value="3 Monate">3 Monate</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Leistungsbeschreibung */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Leistungsbeschreibung</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <label className="block text-xs text-gray-500 mb-1">Beschreibung der zu erbringenden Leistungen im Rahmen der Arbeitnehmer\u00fcberlassung</label>
                    <textarea value={selected.leistungsbeschreibung} onChange={e => updateField('leistungsbeschreibung', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </section>

                {/* Stundensätze / Konditionen */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Stundenverrechungss\u00e4tze / Konditionen</h3>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Qualifikation</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Einsatzbereich</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">\u20ac/Std.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.pricing.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-2.5">
                              <input type="text" value={row.qualifikation} onChange={e => updatePricingRow(idx, 'qualifikation', e.target.value)} className="w-full text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 -mx-1" />
                            </td>
                            <td className="px-4 py-2.5">
                              <input type="text" value={row.einsatz} onChange={e => updatePricingRow(idx, 'einsatz', e.target.value)} className="w-full text-sm text-gray-600 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 -mx-1" />
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center justify-end gap-1">
                                <input type="text" value={row.preis} onChange={e => updatePricingRow(idx, 'preis', e.target.value)} className="w-20 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 text-right" />
                                <span className="text-gray-400 text-xs">\u20ac</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Zuschläge */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Zuschl\u00e4ge</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">\u00dcberstunden (%)</label>
                        <input type="number" value={selected.zuschlaege.ueberstunden} onChange={e => updateZuschlag('ueberstunden', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nachtzuschlag (%)</label>
                        <input type="number" value={selected.zuschlaege.nacht} onChange={e => updateZuschlag('nacht', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Sonntagszuschlag (%)</label>
                        <input type="number" value={selected.zuschlaege.sonntag} onChange={e => updateZuschlag('sonntag', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Feiertagszuschlag (%)</label>
                        <input type="number" value={selected.zuschlaege.feiertag} onChange={e => updateZuschlag('feiertag', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Zahlungsbedingungen */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Zahlungsbedingungen</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Zahlungsziel</label>
                      <select value={selected.zahlungsziel} onChange={e => updateField('zahlungsziel', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="7 Tage">7 Tage</option>
                        <option value="14 Tage">14 Tage</option>
                        <option value="30 Tage">30 Tage</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Abrechnungsintervall</label>
                      <select value={selected.abrechnungsintervall} onChange={e => updateField('abrechnungsintervall', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="W\u00f6chentlich">W\u00f6chentlich</option>
                        <option value="14-t\u00e4gig">14-t\u00e4gig</option>
                        <option value="Monatlich">Monatlich</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Besondere Vereinbarungen */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Besondere Vereinbarungen</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <textarea value={selected.besondereVereinbarungen} onChange={e => updateField('besondereVereinbarungen', e.target.value)} rows={3} placeholder="Individuelle Vereinbarungen, Sonderkonditionen, etc." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </section>

                {/* Interne Notizen */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Interne Notizen</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <textarea value={selected.notes} onChange={e => updateField('notes', e.target.value)} rows={2} placeholder="Interne Notizen (erscheinen nicht im PDF)" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </section>

              </div>
            ) : (
              <div className="flex items-start justify-center p-6 bg-gray-200 min-h-full">
                <div className="shadow-2xl" style={{ transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: '-200px' }}>
                  <iframe key={JSON.stringify(selected)} srcDoc={generateHTML(selected, companyProfile)}
                    style={{ width: '210mm', height: '297mm', border: 'none', display: 'block', background: '#fff' }}
                    title="Rahmenvertrag Vorschau" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-gray-900 text-white'}`}>
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      )}
    </div>
  )
}
