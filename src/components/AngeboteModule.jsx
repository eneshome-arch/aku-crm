import { api } from '../api'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, FileText, Trash2, Download, Save, Eye, Edit3, ChevronLeft, X, Search, UserCheck, RefreshCw, Scissors } from 'lucide-react'

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
    subjectTitle: 'Flexibles Pflegepersonal\nfür Ihre Einrichtung',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der stationären Alten- und Langzeitpflege.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die Überlassung von qualifiziertem Pflegepersonal an Einrichtungen der stationären und ambulanten Pflege. Unsere Mitarbeiterinnen und Mitarbeiter werden sorgfältig ausgewählt, sind examiniert oder entsprechend qualifiziert und stehen Ihnen bundesweit kurzfristig zur Verfügung – damit Sie Engpässe schnell und zuverlässig überbrücken können.',
    highlightText: 'Kein Personalrisiko, keine Lohnnebenkosten, volle Flexibilität. Sie erhalten einsatzbereites Personal genau dann, wenn Sie es brauchen – für einzelne Schichten oder längere Einsätze, deutschlandweit.',
    pricing: [
      { qualifikation: 'Examinierte Pflegefachkraft', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Grund- & Behandlungspflege', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-jährig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Hauswirtschaftskraft', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Hauswirtschaft, Versorgung', preis: '29,30' },
    ],
  },
  krankenhaus: {
    label: '🏥 Krankenhaus / Klinik',
    subjectTitle: 'Qualifiziertes Pflegepersonal\nfür Ihre Klinik',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der Gesundheits- und Krankenpflege.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die kurzfristige Überlassung von examinierten Pflegefachkräften und Krankenpflegehelfern an Krankenhäuser und Kliniken. Unsere Mitarbeiterinnen und Mitarbeiter sind stationserfahren, verfügen über fundierte Fachkenntnisse und stehen Ihnen bundesweit auch bei kurzfristigem Bedarf zuverlässig zur Verfügung.',
    highlightText: 'Engpässe durch Krankheit, Urlaub oder erhöhtes Patientenaufkommen zuverlässig abfedern – mit examiniertem Fachpersonal, das von Tag eins an voll einsatzbereit ist. Bundesweiter Einsatz möglich.',
    pricing: [
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Stationspflege, Akutversorgung', preis: '54,50' },
      { qualifikation: 'Krankenpflegehelfer/in', badge: '1-jährig', badgeColor: 'blue', einsatz: 'Grundpflege, Stationsunterstützung', preis: '38,00' },
      { qualifikation: 'Stationshilfe', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Versorgung, Servicetätigkeiten', preis: '29,30' },
    ],
  },
  ambulant: {
    label: '🚗 Ambulanter Pflegedienst',
    subjectTitle: 'Flexibles Personal\nfür Ihren Pflegedienst',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung für Ihren ambulanten Pflegedienst.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die flexible Personalüberlassung für ambulante Pflegedienste. Unsere Mitarbeiterinnen und Mitarbeiter sind tourenerprobt, verfügen über fundierte pflegerische Kenntnisse und sind in der Lage, auch kurzfristig Touren zu übernehmen – an jedem Standort in Deutschland.',
    highlightText: 'Touren lückenlos besetzen – auch bei plötzlichem Ausfall. Sie erhalten einsatzbereites, mobiles Pflegepersonal genau dann, wenn Sie es brauchen, überall in Deutschland.',
    pricing: [
      { qualifikation: 'Pflegefachkraft ambulant', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Behandlungs- & Grundpflege, Touren', preis: '51,80' },
      { qualifikation: 'Pflegehilfskraft', badge: '1-jährig / Helfer', badgeColor: 'blue', einsatz: 'Grundpflege, Betreuung', preis: '36,60' },
      { qualifikation: 'Alltagsbegleiter/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Betreuung, hauswirtsch. Versorgung', preis: '27,00' },
    ],
  },
  reha: {
    label: '🏋️ Reha-Klinik',
    subjectTitle: 'Fachpersonal für Pflege & Therapie\nfür Ihre Reha-Einrichtung',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung von Pflege- und therapeutischem Fachpersonal für Ihre Rehabilitationsklinik.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die Überlassung von Pflege- und Fachpersonal an Rehabilitationskliniken und Therapieeinrichtungen. Unsere Mitarbeiterinnen und Mitarbeiter verfügen über Reha-Erfahrung und unterstützen Ihr Team sowohl in der Pflege als auch bei therapeutischen Hilfsleistungen – bundesweit.',
    highlightText: 'Flexibel aufstocken, wenn Bedarf besteht – ohne Risiko und ohne langfristige Bindung. Wir stellen Ihnen deutschlandweit qualifiziertes Personal für genau die Zeit, die Sie benötigen.',
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
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover und Erfahrung in der Überlassung von psychiatrieerfahrenem Pflege- und Betreuungspersonal. Unsere Mitarbeiterinnen und Mitarbeiter bringen sowohl pflegerische Fachkompetenz als auch Einfühlungsvermögen mit – für eine professionelle und menschliche Versorgung Ihrer Patientinnen und Patienten, an jedem Standort in Deutschland.',
    highlightText: 'Zuverlässige Besetzung von Schichten auch in herausfordernden Versorgungssituationen – mit psychiatrieerfahrenem Personal, das Ihr Team von Anfang an entlastet. Bundesweiter Einsatz.',
    pricing: [
      { qualifikation: 'Psychiatriefachpfleger/in', badge: 'Fachweiterbildung', badgeColor: 'green', einsatz: 'Psychiatrische Stationspflege', preis: '54,50' },
      { qualifikation: 'Gesundheits- und Krankenpfleger/in', badge: '3-jährig examiniert', badgeColor: 'blue', einsatz: 'Allgemeinpflege, Betreuung', preis: '51,80' },
      { qualifikation: 'Sozialpädagoge/in', badge: 'B.A. / Diplom', badgeColor: 'gray', einsatz: 'Soziale Begleitung, Gruppenarbeit', preis: '48,00' },
    ],
  },
  eingliederung: {
    label: '♿ Behinderteneinrichtung / Eingliederungshilfe',
    subjectTitle: 'Pädagogisches und pflegerisches Personal\nfür Ihre Einrichtung',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich der Eingliederungshilfe und Behindertenbetreuung.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die Überlassung von pädagogischem und pflegerischem Fachpersonal für Einrichtungen der Eingliederungshilfe. Unsere Mitarbeiterinnen und Mitarbeiter verfügen über Erfahrung in der Arbeit mit Menschen mit Behinderung und stehen Ihnen bundesweit kurzfristig zur Verfügung.',
    highlightText: 'Personallücken schnell schließen – mit qualifizierten Fachkräften, die Ihre Klientel und die besondere Herausforderung der Arbeit kennen und respektieren. Deutschlandweiter Einsatz.',
    pricing: [
      { qualifikation: 'Heilerziehungspfleger/in', badge: '3-jährig examiniert', badgeColor: 'green', einsatz: 'Pädagogische Betreuung, Pflege', preis: '51,80' },
      { qualifikation: 'Sozialpädagoge/in', badge: 'B.A. / Diplom', badgeColor: 'blue', einsatz: 'Soziale Arbeit, Gruppenleitung', preis: '48,00' },
      { qualifikation: 'Betreuungshelfer/in', badge: 'Qualifiziert', badgeColor: 'gray', einsatz: 'Alltagsbegleitung, Assistenz', preis: '33,00' },
    ],
  },
  logistik: {
    label: '🚛 Logistikunternehmen',
    subjectTitle: 'Zuverlässiges Lagerpersonal\nfür Ihr Unternehmen',
    introText: 'vielen Dank für Ihr Interesse und das angenehme Gespräch. Wie besprochen, erhalten Sie hiermit unser Angebot zur Arbeitnehmerüberlassung im Bereich Lager, Logistik und Kommissionierung.',
    body2: 'Zeitblick Personalservice ist ein deutschlandweit tätiger Personaldienstleister mit Sitz in Hannover, spezialisiert auf die flexible Überlassung von Fach- und Hilfskräften für Logistik, Lager und Versand. Unsere Mitarbeiterinnen und Mitarbeiter sind erfahren im Umgang mit Warenwirtschaftssystemen, Kommissionierung und Versandabwicklung – und stehen Ihnen bundesweit auch kurzfristig zur Verfügung, um saisonale Spitzen oder Personalengpässe zuverlässig abzufangen.',
    highlightText: 'Flexibel skalieren ohne Personalrisiko – ob Saisonspitze, Großauftrag oder kurzfristiger Ausfall. Sie erhalten einsatzbereites, erfahrenes Lagerpersonal genau dann, wenn Sie es brauchen – an jedem Standort in Deutschland.',
    pricing: [
      { qualifikation: 'Lagerhelfer/in', badge: 'Hilfskraft', badgeColor: 'gray', einsatz: 'Sortierung, Kommissionierung, Verpackung', preis: '25,50' },
      { qualifikation: 'Kommissionierer/in', badge: 'Erfahren', badgeColor: 'blue', einsatz: 'Wareneingang, Kommissionierung, Versand', preis: '27,00' },
      { qualifikation: 'Staplerfahrer/in', badge: 'Staplerschein', badgeColor: 'green', einsatz: 'Stapler, Ein-/Auslagerung, Warenumschlag', preis: '30,00' },
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
    surcharges: [
      { label: 'Überstunden', detail: 'ab der 40,01. Wochenstunde', value: '25' },
      { label: 'Nachtzuschlag', detail: '23:00 – 06:00 Uhr', value: '35' },
      { label: 'Sonntagszuschlag', detail: 'alle Stunden am Sonntag', value: '60' },
      { label: 'Feiertagszuschlag', detail: 'alle Stunden an Feiertagen', value: '110' },
    ],
    status: 'entwurf',
    notes: '',
    pageBreakAfter: 'pricing',
  }
}

function formatDateDE(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function generateHTML(offer, company = {}) {
  const c = {
    name: company.companyName || 'Zeitblick Personalservice',
    logo: company.logo || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAABLKADAAQAAAABAAAAyAAAAADOaDBdAAA1uUlEQVR4Ae2dB4BU1fX/33vTy852tlJ26X0pUozRv7HkHw1qNAoIKhhL1JiYWJJfkp+iiUmsMWr8iw1L6EqCKcbYSxQElN5ZYVkWtu/OTm/v/z33zczOzM5WSgieB7Ov3fY+997zzj23PEnijQkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTABJsAEmAATYAJMgAkwASbABJgAE2ACTIAJMAEmwASYABNgAkyACTCBvhOQ++715PSZn59vN5cXnK7X6YaHZdnp9/s31K7fsfXkTC2nigkwgd4QOKUEVuGkkRea7JYH9UbDKElRBAc1HPEGvL4lntqDP2na2+TsDRx2ywSYwMlFQHdyJafvqSmoGH6xNcexXDEaitWIqqqS9k9WFIPBbJ5otNrHmbyR1W63O9j3WNgnE2AC/0kCp4TAcpSW5tiLsv+iMxnyIpFwRMYWh0qi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',
    accentColor: company.accentColor || '#1e40af',
    address: [company.address, [company.postalCode, company.city].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || 'Vahrenwalder Str. 255 · 30179 Hannover',
    phone: company.phone || '0151 – 546 28224',
    email: company.email || 'info@zeitblick-personal.de',
    website: company.website || 'www.zeitblick-personal.de',
    footerText: company.footerText || '',
    contactPerson: company.contactPerson || 'Enes Cansever – Vertrieb',
    ustId: company.ustId || '',
  }
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

  const headerHTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Angebot – ${c.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter','Helvetica Neue',Arial,sans-serif; font-size:10pt; color:#1e293b; background:#fff; line-height:1.6; }
    .page { width:210mm; min-height:297mm; margin:0 auto; background:#fff; display:flex; flex-direction:column; position:relative; }
    .page-2 { width:210mm; min-height:297mm; margin:0 auto; background:#fff; display:flex; flex-direction:column; page-break-before:always; }
    .header { background:#0f172a; padding:26px 40px 22px; display:flex; justify-content:space-between; align-items:flex-end; }
    .header-logo img { height:40px; width:auto; display:block; }
    .header-tagline { font-size:8pt; color:rgba(255,255,255,0.45); letter-spacing:0.12em; text-transform:uppercase; margin-top:7px; }
    .header-contact { text-align:right; }
    .header-contact p { font-size:8.5pt; color:rgba(255,255,255,0.6); line-height:1.7; }
    .header-contact strong { color:rgba(255,255,255,0.9); font-weight:500; }
    .accent-bar { height:3px; background:linear-gradient(to right,${c.accentColor},#06b6d4); }
    .body { padding:16px 40px 18px; flex:1; }
    .meta-row { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #e2e8f0; }
    .meta-label { font-size:7.5pt; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:#94a3b8; margin-bottom:5px; }
    .meta-company { font-size:10pt; color:#1e293b; }
    .offer-number-val { font-size:11pt; font-weight:700; color:#0f172a; }
    .meta-date { font-size:8.5pt; color:#64748b; margin-top:5px; }
    .badge-pill { display:inline-block; background:#dbeafe; color:#1d4ed8; font-size:7.5pt; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; padding:3px 12px; border-radius:100px; margin-bottom:7px; }
    .subject-title { font-size:15pt; font-weight:700; color:#0f172a; line-height:1.2; letter-spacing:-0.3px; margin-bottom:12px; }
    .salutation { font-size:10pt; margin-bottom:8px; color:#1e293b; }
    .letter-text p { margin-bottom:7px; color:#334155; font-size:9.5pt; line-height:1.65; }
    .highlight-box { background:#f0f9ff; border-left:3px solid #3b82f6; border-radius:0 8px 8px 0; padding:8px 16px; margin:8px 0; }
    .highlight-box p { color:#1e40af; font-size:9pt; margin:0; }
    .section { margin:10px 0; }
    .section-title { font-size:8pt; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${c.accentColor}; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
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
    .closing { margin-top:14px; padding-top:10px; border-top:1px solid #e2e8f0; }
    .closing p { font-size:9.5pt; color:#334155; line-height:1.65; margin-bottom:7px; }
    .signature { margin-top:12px; }
    .sig-greeting { font-size:10pt; color:#334155; margin-bottom:12px; }
    .sig-name { font-size:11pt; font-weight:700; color:#0f172a; }
    .sig-role { font-size:8.5pt; color:#64748b; margin-top:3px; }
    .sig-company { font-size:8.5pt; color:${c.accentColor}; font-weight:600; margin-top:2px; }
    .footer { background:#f8fafc; border-top:1px solid #e2e8f0; padding:11px 40px; display:flex; justify-content:space-between; align-items:center; margin-top:auto; }
    .footer p { font-size:7.5pt; color:#94a3b8; line-height:1.6; }
    .footer .footer-brand { font-weight:700; color:#475569; font-size:8pt; }
    .page-2-header { background:#0f172a; padding:14px 40px; display:flex; justify-content:space-between; align-items:center; }
    .page-2-header span { color:rgba(255,255,255,0.7); font-size:8.5pt; }
    .page-2-header strong { color:#fff; font-weight:600; font-size:9pt; }
    .page-2-accent { height:2px; background:linear-gradient(to right,${c.accentColor},#06b6d4); }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } .page, .page-2 { margin:0; width:100%; } @page { margin:0; size:A4; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="header-logo">
        <span style="color:white;font-size:18pt;font-weight:700;letter-spacing:-0.5px">${c.name}</span>
      </div>
      <div class="header-tagline">${c.city ? c.name.split(' ')[0] + ' · ' + (company.city || 'Hannover') : ''}</div>
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
`

  const pricingSectionHTML = `
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
    </div>`

  const surchargesHTML = `
    <div class="section">
      <div class="section-title">Zuschläge</div>
      <div class="surcharge-grid">
        ${(offer.surcharges || []).map(s => `
        <div class="surcharge-item"><div class="surcharge-label">${s.label}<small>${s.detail}</small></div><div class="surcharge-value">+ ${s.value} %</div></div>
        `).join('')}
      </div>
    </div>`

  const termsHTML = `
    <div class="section">
      <div class="section-title">Abrechnungs- &amp; Zahlungsbedingungen</div>
      <div class="terms-grid">
        <div class="term-item"><div class="term-label">Abrechnung</div><div class="term-value">Wöchentlich auf Basis gegengezeichneter Arbeitsstundennachweise</div></div>
        <div class="term-item"><div class="term-label">Zahlungsziel</div><div class="term-value">14 Tage nach Rechnungseingang, netto ohne Abzug</div></div>
        <div class="term-item"><div class="term-label">Zahlungsart</div><div class="term-value">Bargeldlose Überweisung</div></div>
        <div class="term-item"><div class="term-label">Grundlage</div><div class="term-value">AGB Zeitblick Personalservice · Arbeitnehmerüberlassungsgesetz (AÜG)</div></div>
      </div>
    </div>`

  const validityHTML = `
    <div class="section">
      <div class="section-title">Angebotsgültigkeit</div>
      <div class="validity-box">
        <div><div class="v-label">Gültig bis</div><div class="v-date">${formatDateDE(offer.validUntil)}</div></div>
        <div class="v-note">Nach Ablauf erstellen wir Ihnen gerne ein aktualisiertes Angebot.</div>
      </div>
    </div>`

  const servicesHTML = `
    <div class="section">
      <div class="section-title">Unsere Leistungen im Überblick</div>
      <div class="terms-grid">
        <div class="term-item"><div class="term-label">Personalauswahl</div><div class="term-value">Sorgfältige Vorauswahl & Qualifikationsprüfung aller eingesetzten Mitarbeiter</div></div>
        <div class="term-item"><div class="term-label">Flexibilität</div><div class="term-value">Kurzfristiger Einsatz auch bei spontanem Bedarf – deutschlandweit verfügbar</div></div>
        <div class="term-item"><div class="term-label">Compliance</div><div class="term-value">Vollständig AÜG-konform, alle gesetzlichen Vorgaben werden eingehalten</div></div>
        <div class="term-item"><div class="term-label">Betreuung</div><div class="term-value">Persönlicher Ansprechpartner für Sie & unsere Mitarbeiter vor Ort</div></div>
      </div>
    </div>`

  const closingHTML = `
    <div class="closing">
      <p>Wir würden uns freuen, Sie als neuen Partner zu gewinnen und Ihre Einrichtung verlässlich zu unterstützen. Gerne besprechen wir in einem persönlichen Gespräch Ihre konkreten Anforderungen und stimmen den Einsatz individuell auf Ihren Bedarf ab.</p>
      <p style="font-weight:600;color:#1e293b">Melden Sie sich einfach bei mir – ich stehe Ihnen für Rückfragen jederzeit zur Verfügung.</p>
    </div>
    <div class="signature">
      <div class="sig-greeting">Mit freundlichen Grüßen</div>
      <div class="sig-name">${c.contactPerson || c.name}</div>
      <div class="sig-role">Geschäftsführung</div>
      <div class="sig-company">${c.name}</div>
    </div>`

  // Sections in order — pageBreakAfter determines which is the last on page 1
  const sectionOrder = ['pricing', 'surcharges', 'terms', 'validity', 'services', 'closing']
  const sectionHTML = { pricing: pricingSectionHTML, surcharges: surchargesHTML, terms: termsHTML, validity: validityHTML, services: servicesHTML, closing: closingHTML }
  const breakIdx = sectionOrder.indexOf(offer.pageBreakAfter || 'pricing')
  const page1Sections = sectionOrder.slice(0, breakIdx + 1).map(k => sectionHTML[k]).join('\n')
  const page2Sections = sectionOrder.slice(breakIdx + 1).map(k => sectionHTML[k]).join('\n')

  const footerHTML = `
  <div class="footer">
    <div><p class="footer-brand">${c.name}</p><p>${c.address}</p></div>
    <div style="text-align:center"><p>Tel. ${c.phone}</p><p>${c.email}</p></div>
    <div style="text-align:right"><p>${c.website}</p>${c.ustId ? `<p>USt-IdNr. ${c.ustId}</p>` : ''}</div>
  </div>`

  return `${headerHTML}
    ${page1Sections}
  </div>
  ${footerHTML}
</div>

<!-- Seite 2 -->
<div class="page-2">
  <div class="page-2-header">
    <span><strong>${c.name}</strong> · Angebot ${offer.offerNumber || ''}</span>
    <span>Seite 2 von 2</span>
  </div>
  <div class="page-2-accent"></div>

  <div class="body">
    ${page2Sections}
  </div>
  ${footerHTML}
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
  const [companyProfile, setCompanyProfile] = useState({})
  const contactSearchRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOffers = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await api.offersList(currentUser.id)
    if (res.success) setOffers(res.offers)
  }, [currentUser])

  const loadContacts = useCallback(async () => {
    if (!currentUser?.id) return
    const res = await api.query(
      `SELECT id, company_name, first_name, last_name, address, city, postal_code FROM contacts WHERE user_id=$1 ORDER BY company_name ASC`,
      [currentUser.id]
    )
    if (res.rows) setContacts(res.rows)
  }, [currentUser])

  useEffect(() => {
    loadOffers()
    loadContacts()
    async function loadCompany() {
      const s = await api.getSettings?.()
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
    const rawItems = o.items || {}
    const items = Array.isArray(rawItems) ? rawItems : (rawItems.pricing || [])
    const savedSurcharges = Array.isArray(rawItems) ? null : (rawItems.surcharges || null)
    const savedPageBreak = Array.isArray(rawItems) ? null : (rawItems.pageBreakAfter || null)
    const defaultSurcharges = [
      { label: 'Überstunden', detail: 'ab der 40,01. Wochenstunde', value: '25' },
      { label: 'Nachtzuschlag', detail: '23:00 – 06:00 Uhr', value: '35' },
      { label: 'Sonntagszuschlag', detail: 'alle Stunden am Sonntag', value: '60' },
      { label: 'Feiertagszuschlag', detail: 'alle Stunden an Feiertagen', value: '110' },
    ]
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
      surcharges: savedSurcharges || defaultSurcharges,
      status: o.status || 'entwurf',
      notes: o.notes || '',
      pageBreakAfter: savedPageBreak || 'pricing',
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
      const res = await api.offersSave({
        id: selected.id,
        userId: currentUser.id,
        contactId: selected.contactId || null,
        docType: 'angebot',
        offerNumber: selected.offerNumber,
        title: selected.recipientCompany || selected.recipientName || 'Angebot',
        items: { pricing: selected.pricing, surcharges: selected.surcharges, pageBreakAfter: selected.pageBreakAfter },
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
    const res = await api.offersDelete(offerId, currentUser.id)
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
      const html = generateHTML(selected, companyProfile)
      const filename = `Angebot_${selected.recipientCompany || 'Zeitblick'}_${selected.offerNumber || new Date().toISOString().slice(0, 10)}.pdf`
      const res = await api.offersExportPdf({ html, filename })
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
  const updateSurchargeRow = (idx, field, value) => setSelected(s => ({
    ...s,
    surcharges: s.surcharges.map((r, i) => i === idx ? { ...r, [field]: value } : r),
  }))
  const addSurcharge = () => setSelected(s => ({
    ...s,
    surcharges: [...s.surcharges, { label: '', detail: '', value: '' }],
  }))
  const removeSurcharge = (idx) => setSelected(s => ({
    ...s,
    surcharges: s.surcharges.filter((_, i) => i !== idx),
  }))

  return (
    <div className="flex h-full bg-gray-50">
      {/* LEFT — hidden on mobile when an offer is selected */}
      <div className={`w-full md:w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
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
        <div className="flex-1 hidden md:flex items-center justify-center">
          <div className="text-center text-gray-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Angebot auswählen oder neu erstellen</p>
            <button onClick={handleNew} className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors">Neues Angebot</button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-2 flex flex-wrap items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 mr-auto min-w-0">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"><ChevronLeft size={18} /></button>
              <span className="font-semibold text-gray-800 text-sm truncate">{selected.recipientCompany || selected.recipientName || 'Neues Angebot'}</span>
              {selected.id && <span className="text-xs text-gray-400 hidden sm:inline">{selected.offerNumber}</span>}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={selected.status} onChange={e => updateField('status', e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setTab('editor')} className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'editor' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Edit3 size={12} /> <span className="hidden sm:inline">Bearbeiten</span>
                </button>
                <button onClick={() => setTab('preview')} className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'preview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Eye size={12} /> <span className="hidden sm:inline">Vorschau</span>
                </button>
              </div>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Save size={12} /><span className="hidden sm:inline">{saving ? 'Speichern…' : 'Speichern'}</span>
              </button>
              <button onClick={handleExportPdf} disabled={exporting} className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
                <Download size={12} /><span className="hidden sm:inline">{exporting ? 'Exportiere…' : 'PDF'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {tab === 'editor' ? (
              <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">

                {/* Einrichtungstyp */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Einrichtungstyp</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                          onFocus={() => { loadContacts(); setShowContactDropdown(true) }}
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

                {/* Seitenumbruch */}
                <section>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Scissors size={12} /> Seitenumbruch im PDF
                  </h3>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <label className="block text-xs text-gray-500 mb-2">Seite 2 beginnt nach:</label>
                    <select
                      value={selected.pageBreakAfter}
                      onChange={e => updateField('pageBreakAfter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pricing">Stundenverrechnungssätze</option>
                      <option value="surcharges">Zuschläge</option>
                      <option value="terms">Zahlungsbedingungen</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-2">Alle Sektionen nach dem gewählten Punkt erscheinen auf Seite 2.</p>
                  </div>
                </section>

                {/* Zuschläge */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zuschläge</h3>
                    <button onClick={addSurcharge} className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
                      <Plus size={12} /> Zuschlag hinzufügen
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selected.surcharges.map((s, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                        <input type="text" value={s.label} onChange={e => updateSurchargeRow(idx, 'label', e.target.value)} placeholder="Bezeichnung" className="flex-1 text-sm text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-2 py-1" />
                        <input type="text" value={s.detail} onChange={e => updateSurchargeRow(idx, 'detail', e.target.value)} placeholder="Details (z.B. 23:00–06:00)" className="flex-1 text-sm text-gray-500 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-2 py-1" />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">+</span>
                          <input type="text" value={s.value} onChange={e => updateSurchargeRow(idx, 'value', e.target.value)} className="w-14 text-sm font-semibold text-gray-800 bg-transparent focus:outline-none focus:bg-blue-50 rounded px-1 text-right" />
                          <span className="text-gray-400 text-xs">%</span>
                        </div>
                        <button onClick={() => removeSurcharge(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
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
                <div className="shadow-2xl" style={{ transform: 'scale(0.72)', transformOrigin: 'top center', marginBottom: '-400px' }}>
                  <iframe key={JSON.stringify(selected)} srcDoc={generateHTML(selected, companyProfile)}
                    style={{ width: '210mm', height: '594mm', border: 'none', display: 'block', background: '#fff' }}
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
