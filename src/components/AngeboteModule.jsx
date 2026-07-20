import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, FileText, Trash2, Download, Save, Eye, Edit3, ChevronLeft, X, Search, UserCheck, RefreshCw } from 'lucide-react'

const STATUS_LABELS = {
  entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-600' },
  verschickt: { label: 'Verschickt', color: 'bg-blue-100 text-blue-700' },
  angenommen: { label: 'Angenommen', color: 'bg-green-100 text-green-700' },
  abgelehnt: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700' },
}

// ── Einrichtungstypen mit vollständigen Texten ──────────────────────────────
const EINRICHTUNG_TYPEN = {
  pflegeheim: {
    label: '🏠 Pflegeheim / Seniorenzentrum',
    subjectTitle: 'Flexibles Pflegepersonal\nfür Ihre Einrichtung in Hannover',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der stationären Alten- und Langzeitpflege.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister, spezialisiert auf die Überlassung von qualifiziertem Pflegepersonal an Einrichtungen der stationären und ambulanten Pflege. Unsere Mitarbeiterinnen und Mitarbeiter werden sorgfältig ausgewählt, sind examiniert oder entsprechend qualifiziert und stehen kurzfristig zur Verfügung – damit Sie Engpässe schnell und zuverlässig überbrücken können.',
    highlightText: 'Kein Personalrisiko, keine Lohnnebenkosten, volle Flexibilität. Sie erhalten einsatzbereites Personal genau dann, wenn Sie es brauchen – für einzelne Schichten oder längere Einsätze.',
    pricing: [
      { qualifikation: 'Examinierte Pflegefachkraft', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Grund- & Behandlungspflege', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-jährig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Hauswirtschaftskraft', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Hauswirtschaft, Versorgung', preis: '29,30' },
    ],
  },
  krankenhaus: {
    label: '🏥 Krankenhaus / Klinik',
    subjectTitle: 'Qualifiziertes Pflegepersonal\nfür Ihre Klinik in Hannover',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der Gesundheits- und Krankenpflege.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister, spezialisiert auf die kurzfristige Überlassung von examinierten Pflegefachkräften und Krankenpflegehelfern an Krankenhäuser und Kliniken. Unsere Mitarbeiterinnen und Mitarbeiter sind stationserfahren, verfügen über fundierte Fachkenntnisse und stehen Ihnen auch bei kurzfristigem Bedarf zuverlässig zur Verfügung.',
    highlightText: 'Engpässe durch Krankheit, Urlaub oder erhöhtes Patientenaufkommen zuverlässig abfedern – mit examiniertem Fachpersonal, das von Tag eins an voll einsatzbereit ist.',
    pricing: [
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Stationspflege, Akutversorgung', preis: '54,50' },
      { qualifikation: 'Krankenpflegehelfer/in', badge: '1-jährig', badgeColor: 'blue', einsatz: 'Grundpflege, Stationsunterstützung', preis: '38,00' },
      { qualifikation: 'Stationshilfe', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Versorgung, Servicetätigkeiten', preis: '29,30' },
    ],
  },
  ambulant: {
    label: '🚗 Ambulanter Pflegedienst',
    subjectTitle: 'Flexibles Personal\nfür Ihren Pflegedienst in Hannover',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung für Ihren ambulanten Pflegedienst.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister, spezialisiert auf die flexible Personalüberlassung für ambulante Pflegedienste in der Region Hannover und Umgebung. Unsere Mitarbeiterinnen und Mitarbeiter sind tourenerprobt, verfügen über fundierte pflegerische Kenntnisse und sind in der Lage, auch kurzfristig Touren zu übernehmen.',
    highlightText: 'Touren lückenlos besetzen – auch bei plötzlichem Ausfall. Sie erhalten einsatzbereites, mobiles Pflegepersonal genau dann, wenn Sie es brauchen.',
    pricing: [
      { qualifikation: 'Pflegefachkraft ambulant', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Behandlungs- & Grundpflege, Touren', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-jährig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Alltagsbegleiter/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Betreuung, hauswirtsch. Versorgung', preis: '27,00' },
    ],
  },
  reha: {
    label: '🏋️ Reha-Klinik',
    subjectTitle: 'Fachpersonal für Pflege & Therapie\nin Ihrer Reha-Einrichtung',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung von Pflege- und therapeutischem Fachpersonal für Ihre Rehabilitationsklinik.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister, spezialisiert auf die Überlassung von Pflege- und Fachpersonal an Rehabilitationskliniken und Therapieeinrichtungen. Unsere Mitarbeiterinnen und Mitarbeiter verfügen über Reha-Erfahrung und unterstützen Ihr Team sowohl in der Pflege als auch bei therapeutischen Hilfsleistungen.',
    highlightText: 'Flexibel aufstocken, wenn Bedarf besteht – ohne Risiko und ohne langfristige Bindung. Wir stellen Ihnen qualifiziertes Personal für genau die Zeit, die Sie benötigen.',
    pricing: [
      { qualifikation: 'Pflegefachkraft', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Pflegeprozess, Patientenbetreuung', preis: '51,80' },
      { qualifikation: 'Therapeutische Fachkraft', badge: 'Fachqualifikation', badgeColor: 'blue', einsatz: 'Unterstützung Therapiemaßnahmen', preis: '48,00' },
      { qualifikation: 'Pflegehilfskraft', badge: 'Helfer', badgeColor: 'gray', einsatz: 'Grundpflege, Servicetätigkeiten', preis: '36,60' },
    ],
  },
  psychiatrie: {
    label: '🧠 Psychiatrie / Sozialpsychiatrie',
    subjectTitle: 'Erfahrenes Fachpersonal\nfür Ihre psychiatrische Einrichtung',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im psychiatrischen und sozialpsychiatrischen Bereich.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister mit Erfahrung in der Überlassung von psychiatrieerfahrenem Pflege- und Betreuungspersonal. Unsere Mitarbeiterinnen und Mitarbeiter bringen sowohl pflegerische Fachkompetenz als auch Einfühlungsvermögen mit – für eine professionelle und menschliche Versorgung Ihrer Patientinnen und Patienten.',
    highlightText: 'Zuverlässige Besetzung von Schichten auch in herausfordernden Versorgungssituationen – mit psychiatrieerfahrenem Personal, das Ihr Team von Anfang an entlastet.',
    pricing: [
      { qualifikation: 'Psychiatriefachpfleger/in', badge: 'Fachweiterbildung', badgeColor: 'green', einsatz: 'Psychiatrische Stationspflege', preis: '54,50' },
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-jährig examiniert', badgeColor: 'blue', einsatz: 'Allgemeinpflege, Betreuung', preis: '51,80' },
      { qualifikation: 'Sozialpädagoge/in', badge: 'B.A. / Diplom', badgeColor: 'gray', einsatz: 'Soziale Begleitung, Gruppenarbeit', preis: '48,00' },
    ],
  },
  eingliederung: {
    label: '♿ Behinderteneinrichtung / Eingliederungshilfe',
    subjectTitle: 'Pädagogisches und pflegerisches Personal\nfür Ihre Einrichtung in Hannover',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der Eingliederungshilfe und Behindertenbetreuung.',
    body2: 'Zeitblick Personalservice ist ein in Hannover ansässiger Personaldienstleister, spezialisiert auf die Überlassung von pädagogischem und pflegerischem Fachpersonal für Einrichtungen der Eingliederungshilfe. Unsere Mitarbeiterinnen und Mitarbeiter verfügen über Erfahrung in der Arbeit mit Menschen mit Behinderung und stehen Ihnen kurzfristig zur Verfügung.',
    highlightText: 'Personallücken schnell schließen – mit qualifizierten Fachkräften, die Ihre Klientel und die besondere Herausforderung der Arbeit kennen und respektieren.',
    pricing: [
      { qualifikation: 'Heilerziehungspfleger/in', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Pädagogische Betreuung, Pflege', preis: '51,80' },
      { qualifikation: 'Sozialpädagoge/in', badge: 'B.A. / Diplom', badgeColor: 'blue', einsatz: 'Soziale Arbeit, Gruppenleitung', preis: '48,00' },
      { qualifikation: 'Betreuungshelfer/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Alltagsbegleitung, Assistenz', preis: '33,00' },
    ],
  },
}

function newOffer(typ = 'pflegeheim') {
  const t = EINRICHTUNG_TYPEN[typ]
  const today = new Date()
  const validUntil = new Date(today)
  validUntil.setMonth(validUntil.getMonth() + 6)
  return {
    id: null,
    contactId: null,
    einrichtungsTyp: typ,
    recipientName: '',
    recipientCompany: '',
    recipientAddress: '',
    offerNumber: '',
    date: today.toISOString().slice(0, 10),
    validUntil: validUntil.toISOString().slice(0, 10),
    subjectTitle: t.subjectTitle,
    introText: t.introText,
    body2: t.body2,
    highlightText: t.highlightText,
    pricing: t.pricing.map(r => ({ ...r })),
    status: 'entwurf',
    notes: '',
  }
}

function formatDateDE(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function generateHTML(offer) {
  const badgeColors = {
    green: 'background:#dcfce7;color:#166534',
    blue: 'background:#dbeafe;color:#1d4ed8',
    gray: 'background:#f1f5f9;color:#475569',
  }

  const subjectLines = (offer.subjectTitle || '').split('\n')
  const subjectHTML = subjectLines.length > 1
    ? `${subjectLines[0]}<br>${subjectLines[1]}`
    : subjectLines[0]

  const pricingRows = offer.pricing.map(row => `
    <tr>
      <td style="padding:11px 16px;font-size:9.5pt;color:#1e293b;vertical-align:middle;border-bottom:1px solid #f1f5f9">
        ${row.qualifikation}
        <span style="display:inline-block;${badgeColors[row.badgeColor] || badgeColors.blue};font-size:7pt;font-weight:600;padding:2px 8px;border-radius:100px;margin-left:6px;vertical-align:middle">${row.badge}</span>
      </td>
      <td style="padding:11px 16px;font-size:9.5pt;color:#1e293b;vertical-align:middle;border-bottom:1px solid #f1f5f9">${row.einsatz}</td>
      <td style="padding:11px 16px;font-size:10.5pt;font-weight:700;color:#0f172a;text-align:right;vertical-align:middle;border-bottom:1px solid #f1f5f9">${row.preis} €</td>
    </tr>
  `).join('')

  const recipientLines = [
    offer.recipientName,
    offer.recipientCompany,
    offer.recipientAddress,
  ].filter(Boolean).join('<br>')

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Angebot – Zeitblick Personalservice</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:10pt; color:#1e293b; background:#fff; line-height:1.6; }
    .page { width:210mm; height:297mm; margin:0 auto; background:#fff; display:flex; flex-direction:column; }
    .header { background:#0f172a; padding:26px 40px 22px; display:flex; justify-content:space-between; align-items:flex-end; }
    .header-logo img { height:40px; width:auto; display:block; }
    .header-tagline { font-size:8pt; color:rgba(255,255,255,0.45); letter-spacing:0.12em; text-transform:uppercase; margin-top:7px; }
    .header-contact { text-align:right; }
    .header-contact p { font-size:8.5pt; color:rgba(255,255,255,0.6); line-height:1.7; }
    .header-contact strong { color:rgba(255,255,255,0.9); font-weight:500; }
    .accent-bar { height:3px; background:linear-gradient(to right,#3b82f6,#06b6d4); }
    .body { padding:20px 40px 24px; flex:1; }
    .meta-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:14px; border-bottom:1px solid #e2e8f0; }
    .meta-label { font-size:7.5pt; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; margin-bottom:5px; }
    .meta-company { font-size:10pt; color:#1e293b; }
    .offer-number-val { font-size:11pt; font-weight:700; color:#0f172a; }
    .meta-date { font-size:8.5pt; color:#64748b; margin-top:5px; }
    .badge-pill { display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:7.5pt; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 12px; border-radius:100px; margin-bottom:7px; }
    .subject-title { font-size:15pt; font-weight:700; color:#0f172a; line-height:1.2; letter-spacing:-0.3px; margin-bottom:12px; }
    .salutation { font-size:10pt; margin-bottom:8px; color:#1e293b; }
    .letter-text p { margin-bottom:7px; color:#334155; font-size:9.5pt; line-height:1.65; }
    .highlight-box { background:#f0f9ff; border-left:3px solid #3b82f6; border-radius:0 8px 8px 0; padding:10px 16px; margin:10px 0; }
    .highlight-box p { color:#1e40af; font-size:9pt; margin:0; }
    .section { margin:14px 0; }
    .section-title { font-size:8pt; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:#3b82f6; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .section-title::after { content:''; flex:1; height:1px; background:#e2e8f0; }
    .pricing-table { width:100%; border-collapse:collapse; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
    .pricing-table thead tr { background:#0f172a; }
    .pricing-table thead th { padding:11px 16px; text-align:left; font-size:8pt; font-weight:600; color:rgba(255,255,255,0.7); letter-spacing:0.06em; text-transform:uppercase; }
    .pricing-table thead th:last-child { text-align:right; }
    .pricing-table tbody tr:nth-child(even) { background:#f8fafc; }
    .price-note { font-size:7.5pt; color:#94a3b8; text-align:right; margin-top:5px; }
    .surcharge-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:4px; }
    .surcharge-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:9px 13px; display:flex; justify-content:space-between; align-items:center; }
    .surcharge-label { font-size:9pt; color:#475569; }
    .surcharge-label small { display:block; font-size:7.5pt; color:#94a3b8; margin-top:1px; }
    .surcharge-value { font-size:10pt; font-weight:700; color:#0f172a; }
    .terms-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    .term-item { padding:9px 13px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; }
    .term-label { font-size:7.5pt; font-weight:600; color:#94a3b8; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:2px; }
    .term-value { font-size:9pt; color:#1e293b; line-height:1.5; }
    .validity-box { background:#0f172a; border-radius:10px; padding:13px 18px; display:flex; justify-content:space-between; align-items:center; margin-top:7px; }
    .v-label { font-size:8pt; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.08em; }
    .v-date { font-size:11pt; font-weight:700; color:#fff; margin-top:2px; }
    .v-note { font-size:8pt; color:rgba(255,255,255,0.5); text-align:right; max-width:180px; line-height:1.4; }
    .closing { margin-top:18px; padding-top:14px; border-top:1px solid #e2e8f0; }
    .closing p { font-size:9.5pt; color:#334155; line-height:1.65; margin-bottom:7px; }
    .signature { margin-top:16px; }
    .sig-greeting { font-size:10pt; color:#334155; margin-bottom:12px; }
    .sig-name { font-size:11pt; font-weight:700; color:#0f172a; }
    .sig-role { font-size:8.5pt; color:#64748b; margin-top:3px; }
    .sig-company { font-size:8.5pt; color:#3b82f6; font-weight:600; margin-top:2px; }
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
        <img src="zeitblick_logo.png" alt="Zeitblick Personalservice" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span style="display:none;color:white;font-size:18pt;font-weight:700;letter-spacing:-0.5px">Zeitblick</span>
      </div>
      <div class="header-tagline">Personalservice · Hannover</div>
    </div>
    <div class="header-contact">
      <p><strong>Enes Cansever</strong></p>
      <p>Vertrieb &amp; Personaldisposition</p>
      <p>Tel. 0163 – 864 4309</p>
      <p>info@zeitblick-personal.de</p>
      <p>www.zeitblick-personal.de</p>
    </div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">
    <div class="meta-row">
      <div>
        <div class="meta-label">An</div>
        <div class="meta-company">${recipientLines || '<span style="color:#94a3b8;font-style:italic">[Empfänger]</span>'}</div>
      </div>
      <div style="text-align:right">
        <div class="meta-label">Angebotsnr.</div>
        <div class="offer-number-val">${offer.offerNumber || 'ZB-2026-XXX'}</div>
        <div class="meta-date">Hannover, ${formatDateDE(offer.date)}</div>
      </div>
    </div>

    <div style="margin-bottom:12px">
      <div class="badge-pill">Angebot Arbeitnehmerüberlassung</div>
      <div class="subject-title">${subjectHTML}</div>
    </div>

    <div class="salutation">Sehr geehrte Damen und Herren,</div>
    <div class="letter-text">
      <p>${offer.introText}</p>
      <p>${offer.body2}</p>
    </div>
    <div class="highlight-box">
      <p><strong>Ihr Vorteil:</strong> ${offer.highlightText}</p>
    </div>

    <div class="section">
      <div class="section-title">Stundenverrechnungssätze (netto, zzgl. MwSt.)</div>
      <table class="pricing-table">
        <thead><tr>
          <th style="width:55%">Qualifikation (m/w/d)</th>
          <th>Einsatzbereich</th>
          <th>Stundensatz</th>
        </tr></thead>
        <tbody>${pricingRows}</tbody>
      </table>
      <div class="price-note">Alle Preise in Euro netto · zzgl. der zum Zeitpunkt der Rechnungsstellung gültigen gesetzlichen MwSt.</div>
    </div>

    <div class="section">
      <div class="section-title">Zuschläge</div>
      <div class="surcharge-grid">
        <div class="surcharge-item"><div class="surcharge-label">Überstunden<small>ab der 40,01. Wochenstunde</small></div><div class="surcharge-value">+ 25 %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Nachtzuschlag<small>23:00 – 06:00 Uhr</small></div><div class="surcharge-value">+ 35 %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Sonntagszuschlag<small>alle Stunden am Sonntag</small></div><div class="surcharge-value">+ 60 %</div></div>
        <div class="surcharge-item"><div class="surcharge-label">Feiertagszuschlag<small>alle Stunden an Feiertagen</small></div><div class="surcharge-value">+ 110 %</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Abrechnungs- &amp; Zahlungsbedingungen</div>
      <div class="terms-grid">
        <div class="term-item"><div class="term-label">Abrechnung</div><div class="term-value">Wöchentlich auf Basis gegengezeichneter Arbeitsstundennachweise</div></div>
        <div class="term-item"><div class="term-label">Zahlungsziel</div><div class="term-value">14 Tage nach Rechnungseingang, netto ohne Abzug</div></div>
        <div class="term-item"><div class="term-label">Zahlungsart</div><div class="term-value">Bargeldlose Überweisung</div></div>
        <div class="term-item"><div class="term-label">Grundlage</div><div class="term-value">AGB Zeitblick Personalservice · Arbeitnehmerüberlassungsgesetz (AÜG)</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Angebotsgültigkeit</div>
      <div class="validity-box">
        <div><div class="v-label">Gültig bis</div><div class="v-date">${formatDateDE(offer.validUntil)}</div></div>
        <div class="v-note">Nach Ablauf erstellen wir Ihnen gerne ein aktualisiertes Angebot.</div>
      </div>
    </div>

    <div class="closing">
      <p>Wir würden uns freuen, Sie als neuen Partner zu gewinnen und Ihre Einrichtung verlässlich zu unterstützen. Gerne besprechen wir in einem persönlichen Gespräch Ihre konkreten Anforderungen und stimmen den Einsatz individuell auf Ihren Bedarf ab.</p>
      <p style="font-weight:600;color:#1e293b">Melden Sie sich einfach bei mir – ich stehe Ihnen für Rückfragen jederzeit zur Verfügung.</p>
    </div>
    <div class="signature">
      <div class="sig-greeting">Mit freundlichen Grüßen</div>
      <div class="sig-name">Tasdemir</div>
      <div class="sig-role">Geschäftsführer</div>
      <div class="sig-company">Zeitblick Personalservice</div>
    </div>
  </div>

  <div class="footer">
    <div><p class="footer-brand">Zeitblick Personalservice</p><p>Vahrenwalder Str. 255 · 30179 Hannover</p></div>
    <div style="text-align:center"><p>Tel. 0163 – 864 4309</p><p>info@zeitblick-personal.de</p></div>
    <div style="text-align:right"><p>www.zeitblick-personal.de</p><p>Lizenz-Nr. gemäß AÜG liegt vor</p></div>
  </div>
</div>
</body>
</html>`
}

export default function AngeboteModule({ currentUser }) {
  const [offers, setOffers] = useState([])
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('editor')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const contactSearchRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOffers = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await window.electronAPI.offersList(currentUser.id)
    if (res.success) setOffers(res.offers)
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
      subjectTitle: t.subjectTitle,
      introText: t.introText,
      body2: t.body2,
      highlightText: t.highlightText,
      pricing: t.pricing.map(r => ({ ...r })),
    }))
  }

  const handleNew = () => {
    setSelected(newOffer('pflegeheim'))
    setTab('editor')
  }

  const handleSelectOffer = (o) => {
    const items = Array.isArray(o.items) ? o.items : []
    const typ = o.template && EINRICHTUNG_TYPEN[o.template] ? o.template : 'pflegeheim'
    const t = EINRICHTUNG_TYPEN[typ]
    // Parse stored intro_text: format is "name\ncompany\naddress\n||\nintroText"
    let recipientName = '', recipientCompany = '', recipientAddress = '', introText = t.introText
    if (o.intro_text) {
      const sepIdx = o.intro_text.indexOf('\n||\n')
      if (sepIdx !== -1) {
        const recipientPart = o.intro_text.slice(0, sepIdx).split('\n')
        introText = o.intro_text.slice(sepIdx + 4)
        recipientName = recipientPart[0] || ''
        recipientCompany = recipientPart[1] || ''
        recipientAddress = recipientPart[2] || ''
      } else {
        introText = o.intro_text
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
      recipientName,
      recipientCompany: recipientCompany || o.title || '',
      recipientAddress,
      offerNumber: o.offer_number || '',
      date: toDateStr(o.created_at) || new Date().toISOString().slice(0, 10),
      validUntil: toDateStr(o.valid_until),
      subjectTitle: t.subjectTitle,
      introText,
      body2: t.body2,
      highlightText: t.highlightText,
      pricing: items.length ? items : t.pricing.map(r => ({ ...r })),
      status: o.status || 'entwurf',
      notes: o.notes || '',
    })
    setTab('editor')
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const introText = [
        selected.recipientName,
        selected.recipientCompany,
        selected.recipientAddress,
        '||',
        selected.introText,
      ].join('\n')
      const res = await window.electronAPI.offersSave({
        id: selected.id,
        userId: currentUser.id,
        contactId: selected.contactId || null,
        docType: 'angebot',
        offerNumber: selected.offerNumber,
        title: selected.recipientCompany || selected.recipientName || 'Angebot',
        items: selected.pricing,
        notes: selected.notes,
        taxRate: 19,
        subtotal: 0, taxAmount: 0, total: 0,
        status: selected.status,
        validUntil: selected.validUntil || null,
        dueDate: null,
        serviceLocation: '',
        processor: 'Enes Cansever',
        introText,
        template: selected.einrichtungsTyp,
      })
      if (res.success) {
        if (!selected.id) setSelected(s => ({ ...s, id: res.id, offerNumber: res.offerNumber || s.offerNumber }))
        await loadOffers()
        showToast('Angebot gespeichert')
      } else {
        showToast(res.error || 'Fehler beim Speichern', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (offerId) => {
    if (!confirm('Angebot löschen?')) return
    const res = await window.electronAPI.offersDelete(offerId, currentUser.id)
    if (res.success) {
      await loadOffers()
      if (selected?.id === offerId) setSelected(null)
      showToast('Angebot gelöscht')
    }
  }

  const handleExportPdf = async () => {
    if (!selected) return
    setExporting(true)
    try {
      const html = generateHTML(selected)
      const filename = `Angebot_${selected.recipientCompany || 'Zeitblick'}_${selected.offerNumber || new Date().toISOString().slice(0, 10)}.pdf`
      const res = await window.electronAPI.offersExportPdf({ html, filename })
      if (res.success) showToast('PDF gespeichert und geöffnet')
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

  return (
    <div className="flex h-full bg-gray-50">
      {/* LEFT */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Angebote</h2>
          <button onClick={handleNew} className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors" title="Neues Angebot">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {offers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              Noch keine Angebote
            </div>
          ) : offers.map(o => {
            const st = STATUS_LABELS[o.status] || STATUS_LABELS.entwurf
            const typLabel = EINRICHTUNG_TYPEN[o.template]?.label?.split(' ')[0] || ''
            return (
              <button key={o.id} onClick={() => handleSelectOffer(o)}
                className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-all group ${selected?.id === o.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-xs truncate">{o.title || 'Ohne Titel'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{typLabel} {o.offer_number}</p>
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
            <p className="text-sm font-medium">Angebot auswählen oder neu erstellen</p>
            <button onClick={handleNew} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors">Neues Angebot</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-gray-800 text-sm">{selected.recipientCompany || selected.recipientName || 'Neues Angebot'}</span>
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
                <Save size={12} />{saving ? 'Speichern…' : 'Speichern'}
              </button>
              <button onClick={handleExportPdf} disabled={exporting} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Download size={12} />{exporting ? 'Exportiere…' : 'Als PDF'}
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
                    <RefreshCw size={10} /> Beim Wechsel werden Betreff, Texte und Stundensätze automatisch angepasst.
                  </p>
                </section>

                {/* Empfänger */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Empfänger</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div className="relative">
                      <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1"><UserCheck size={11} /> Aus Kontakten übernehmen</label>
                      <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input ref={contactSearchRef} type="text" value={contactSearch}
                          onChange={e => { setContactSearch(e.target.value); setShowContactDropdown(true) }}
                          onFocus={() => setShowContactDropdown(true)}
                          onBlur={() => setTimeout(() => setShowContactDropdown(false), 150)}
                          placeholder="Kontakt suchen und auswählen…"
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
                        <input type="text" value={selected.recipientName} onChange={e => updateField('recipientName', e.target.value)} placeholder="z. B. Frau Müller" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Einrichtung / Unternehmen</label>
                        <input type="text" value={selected.recipientCompany} onChange={e => updateField('recipientCompany', e.target.value)} placeholder="z. B. Diakovere Annastift" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Adresse</label>
                        <input type="text" value={selected.recipientAddress} onChange={e => updateField('recipientAddress', e.target.value)} placeholder="z. B. Musterstraße 12, 30159 Hannover" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Metadaten */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Metadaten</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Angebotsnr.</label>
                      <input type="text" value={selected.offerNumber} onChange={e => updateField('offerNumber', e.target.value)} placeholder="ZB-2026-001" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Datum</label>
                      <input type="date" value={selected.date} onChange={e => updateField('date', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Gültig bis</label>
                      <input type="date" value={selected.validUntil} onChange={e => updateField('validUntil', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                {/* Texte */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Texte (individuell anpassbar)</h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Betreff / Titel</label>
                      <textarea value={selected.subjectTitle} onChange={e => updateField('subjectTitle', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Einleitung (nach „Sehr geehrte Damen und Herren,")</label>
                      <textarea value={selected.introText} onChange={e => updateField('introText', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unternehmensvorstellung</label>
                      <textarea value={selected.body2} onChange={e => updateField('body2', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Vorteilsbox (nach „Ihr Vorteil:")</label>
                      <textarea value={selected.highlightText} onChange={e => updateField('highlightText', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                  </div>
                </section>

                {/* Preistabelle */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Stundenverrechnungssätze</h3>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Qualifikation</th>
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Einsatzbereich</th>
                          <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">€/Std.</th>
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
                                <span className="text-gray-400 text-xs">€</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Notizen */}
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
                  <iframe key={JSON.stringify(selected)} srcDoc={generateHTML(selected)}
                    style={{ width: '210mm', height: '297mm', border: 'none', display: 'block', background: '#fff' }}
                    title="Angebot Vorschau" />
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
