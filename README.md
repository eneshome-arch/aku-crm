# Aku CRM – Akquise & Angebote

Electron-App für Zeitblick Personalservice. CRM für Akquiseanrufe, E-Mail-Marketing und Angebotserstellung.

---

## Technik

| | |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Electron (Main Process) |
| Datenbank | PostgreSQL (Remote-Server) |
| Build | `npx vite build` → `app.asar` |

---

## Projektstruktur

```
aku-crm/
├── electron/
│   ├── main.js          # Electron Main Process, alle IPC-Handler, DB-Verbindung
│   └── preload.js       # contextBridge – exposte API ans Frontend
├── src/
│   ├── App.jsx          # Root-Komponente, View-Routing, globaler State
│   ├── main.jsx         # React-Einstiegspunkt
│   ├── index.css        # Tailwind-Basis
│   └── components/
│       ├── AngeboteModule.jsx     # Angebote erstellen, bearbeiten, PDF-Export
│       ├── Sidebar.jsx            # Navigation + Kontaktliste
│       ├── Dashboard.jsx          # Übersicht, Statistiken
│       ├── ContactProfile.jsx     # Kontakt-Detailansicht
│       ├── ContactForm.jsx        # Kontakt anlegen / bearbeiten
│       ├── CallList.jsx           # Anruflisten-Auswahl
│       ├── CallSession.jsx        # Aktive Anrufsession
│       ├── FindCustomers.jsx      # Kundensuche via Overpass/Maps
│       ├── EmailMarketing.jsx     # E-Mail-Kampagnen
│       ├── EmailTemplateBuilder.jsx
│       ├── EmailSettings.jsx
│       ├── RichEditor.jsx
│       ├── AdminPanel.jsx
│       ├── AdminUserDetail.jsx
│       ├── Settings.jsx
│       ├── Login.jsx
│       └── WindowsTitleBar.jsx
├── assets/
│   └── icon.icns
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Module / Features

### CRM Akquise
- Kontaktverwaltung mit Status-Tracking (10 Stufen: Nicht kontaktiert → Aktiver Kunde)
- Follow-up Erinnerungen mit Überfälligkeits-Anzeige
- Anrufsession: sequentielles Durcharbeiten von Kontaktlisten
- Aktivitätslog pro Kontakt
- CSV-Import / Export
- Dokumentenanhänge pro Kontakt
- Kundensuche via OpenStreetMap / Overpass API

### E-Mail Marketing
- Kampagnen mit Rich-Text-Editor (HTML)
- SMTP-Versand direkt aus der App (via Nodemailer)
- Kampagnen-Ergebnisse (Erfolg / Fehler) werden gespeichert

### Angebote (`AngeboteModule.jsx`)
- Angebotsliste mit Status (Entwurf, Verschickt, Angenommen, Abgelehnt)
- **Einrichtungstyp-Auswahl** – passt Betreff, Texte und Stundensätze automatisch an:
  - 🏠 Pflegeheim / Seniorenzentrum
  - 🏥 Krankenhaus / Klinik
  - 🚗 Ambulanter Pflegedienst
  - 🏋️ Reha-Klinik
  - 🧠 Psychiatrie / Sozialpsychiatrie
  - ♿ Behinderteneinrichtung / Eingliederungshilfe
- Empfänger aus CRM-Kontakten auswählen (Auto-Fill)
- Alle Texte individuell anpassbar (Betreff, Einleitung, Unternehmensvorstellung, Vorteilsbox)
- Bearbeitbare Preistabelle (Qualifikation, Einsatzbereich, Stundensatz)
- Live-Vorschau (iframe, A4-skaliert)
- PDF-Export via Electron `printToPDF` → Speicherdialog → direkt geöffnet
- Angebote werden in PostgreSQL-Datenbank gespeichert (`offers`-Tabelle)

### Admin
- Benutzerverwaltung (Passwort zurücksetzen, löschen)
- Touch ID Login (macOS)

---

## Datenbank-Schema (wichtigste Tabellen)

| Tabelle | Inhalt |
|---|---|
| `users` | CRM-Nutzer, Auth, Einstellungen |
| `contacts` | Akquise-Kontakte mit Status & Follow-up |
| `call_history` | Anrufprotokolle |
| `email_campaigns` | E-Mail-Kampagnen & Ergebnisse |
| `offers` | Angebote (Zeitblick-Template, alle Typen) |
| `documents` | Datei-Anhänge pro Kontakt |

---

## Build & Deploy

### Entwicklung
```bash
npm install
npx vite build
```

### In App einspielen (macOS)
```bash
# 1. Frontend bauen
npx vite build

# 2. Staging-Ordner vorbereiten
mkdir -p /tmp/aku-stage
cp package.json /tmp/aku-stage/
cp -r electron dist /tmp/aku-stage/
cp -r /tmp/aku-orig/node_modules /tmp/aku-stage/   # prod node_modules aus installierter App

# 3. asar packen
npx @electron/asar pack /tmp/aku-stage /tmp/app_new.asar

# 4. Einspielen (benötigt sudo)
sudo cp /tmp/app_new.asar /Applications/Aku.app/Contents/Resources/app.asar
```

---

## Login

| | |
|---|---|
| Admin E-Mail | `admin@aku.app` |
| Admin Passwort | `aku-admin-2024` |

---

## Angebot-Vorlage (Zeitblick Personalservice)

Das Angebot-PDF basiert auf dem Zeitblick Corporate Design:
- Dunkler Header (`#0f172a`) mit Logo
- Blauer Akzentstreifen (Gradient `#3b82f6 → #06b6d4`)
- Inter-Font, A4-Format
- Zuschläge (Überstunden +25%, Nacht +35%, Sonntag +60%, Feiertag +110%)
- Zahlungsziel 14 Tage netto
- Unterzeichner: Tasdemir, Geschäftsführer

Die HTML-Vorlage wird dynamisch in `AngeboteModule.jsx` via `generateHTML(offer)` gerendert und per `printToPDF` exportiert.
