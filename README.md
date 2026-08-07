# Aku CRM – Akquise & Angebote

CRM für Zeitblick Personalservice. Akquiseanrufe, E-Mail-Marketing, Angebots- und Rahmenvertragserstellung.

Verfügbar als **Electron Desktop-App** und als **Web-App** unter [app.zeitblick-personal.de](https://app.zeitblick-personal.de).

---

## Web-App

| | |
|---|---|
| Frontend | [app.zeitblick-personal.de](https://app.zeitblick-personal.de) |
| API | [api.zeitblick-personal.de](https://api.zeitblick-personal.de) |
| Hosting | Coolify auf Hetzner |

## Desktop-App Download

**[→ Neueste Version herunterladen](https://github.com/eneshome-arch/aku-crm/releases/latest)**

| System | Datei |
|---|---|
| Mac (M1/M2/M3) | `Aku CRM-1.0.0-arm64.dmg` |
| Mac (Intel) | `Aku CRM-1.0.0.dmg` |

> **Erster Start:** Rechtsklick → Öffnen, dann in Systemeinstellungen → Datenschutz & Sicherheit → „Trotzdem öffnen"

---

## Technik

| | |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Desktop | Electron (Main Process, IPC) |
| API Server | Express.js (JWT Auth, Puppeteer PDF) |
| Datenbank | PostgreSQL (Hetzner/Coolify) |
| Updates | electron-updater (automatisch via GitHub Releases) |

### Dual-Mode Architektur

Die App läuft sowohl als Electron-App als auch im Browser. Ein API-Adapter wählt automatisch:

- **Electron:** `window.electronAPI` → IPC-Calls an Main Process
- **Browser:** `webAPI` → REST-Calls an Express-API

```js
// src/api/index.js
export const api = window.electronAPI || webAPI
```

---

## Projektstruktur

```
aku-crm/
├── electron/
│   ├── main.js          # Electron Main Process, IPC-Handler, DB-Verbindung
│   └── preload.js       # contextBridge – API ans Frontend
├── server/
│   ├── index.js         # Express Server (CORS, Helmet, Rate Limiting)
│   ├── db.js            # PostgreSQL Pool + Migrationen
│   ├── auth.js          # JWT Sign/Verify/Middleware
│   └── routes/
│       ├── auth.js      # Login, Register, Profil
│       ├── query.js     # Raw SQL (JWT-geschützt)
│       ├── offers.js    # Angebote CRUD + PDF (Puppeteer)
│       ├── campaigns.js # E-Mail-Kampagnen
│       ├── email.js     # SMTP Versand
│       ├── admin.js     # Benutzerverwaltung
│       ├── settings.js  # Web-Settings (JSONB)
│       └── fetch.js     # URL-Scraping + Overpass Proxy
├── src/
│   ├── App.jsx          # Root-Komponente, View-Routing
│   ├── api/
│   │   ├── index.js     # api = electronAPI || webAPI
│   │   └── webAPI.js    # REST-Adapter für alle API-Methoden
│   └── components/
│       ├── KundenCRM.jsx          # Kontaktliste, Pipeline, Berichte
│       ├── BelegeModule.jsx       # Belege-Übersicht
│       ├── AngeboteModule.jsx     # Angebote + PDF-Export
│       ├── RahmenvertragModule.jsx # Rahmenverträge
│       ├── FindCustomers.jsx      # Kundensuche via Overpass API
│       ├── EmailMarketing.jsx     # E-Mail-Kampagnen
│       ├── Settings.jsx           # Einstellungen
│       ├── Login.jsx              # Login (Web + Electron)
│       ├── AdminPanel.jsx         # Benutzerverwaltung
│       └── ...
├── Dockerfile           # API Container (Node 20 + Chromium)
├── Dockerfile.frontend  # Frontend Container (Vite build → Nginx)
├── nginx.conf           # SPA-Routing
├── vite.web.config.js   # Web-Build Konfiguration
└── package.json
```

---

## Features

### Kunden & CRM
- Kontaktverwaltung mit Status-Tracking (10 Stufen)
- Einrichtungstyp-Tags (Krankenhaus, Pflegeheim, Ambulante Pflege, Reha, Betreutes Wohnen, Logistik)
- Pipeline-Ansicht (Kanban)
- Follow-up Erinnerungen
- Anrufsession: sequentielles Durcharbeiten
- Kundensuche via OpenStreetMap/Overpass API (bereits hinzugefügte werden markiert)

### E-Mail Marketing
- Kampagnen mit Rich-Text-Editor
- SMTP-Versand (Strato, Outlook, Gmail, GMX, Web.de, IONOS)

### Belege
- **Angebote** – PDF-Export mit Firmenprofil, Einrichtungstyp-spezifische Texte
- **Rahmenverträge** – Individuelle Verträge (RV-YYYY-NNN)
- Status-Tracking: Entwurf → Verschickt → Angenommen/Abgelehnt

### Einstellungen
- Profil, Firmenprofil, E-Mail-Konto, Darstellung, Sprache, Backup

---

## Deployment

### Docker (Coolify)

**API:**
```bash
# Dockerfile → Node 20 + Chromium (Puppeteer PDF)
# Env-Variablen: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, JWT_SECRET
# Custom Docker Options: --network=coolify
```

**Frontend:**
```bash
# Dockerfile.frontend → Vite build + Nginx
# Build-Arg: VITE_API_URL=https://api.zeitblick-personal.de
```

### Entwicklung

```bash
# Electron (Desktop)
npm run dev

# Web (lokal)
npm run dev:web

# API only
npm run start:api

# Produktion bauen
npm run dist
```

---

## Datenbank-Schema

| Tabelle | Inhalt |
|---|---|
| `users` | Nutzer, Auth, E-Mail-Config, web_settings (JSONB) |
| `contacts` | Akquise-Kontakte mit Status, Follow-up & Einrichtungstyp |
| `call_history` | Anrufprotokolle |
| `email_campaigns` | E-Mail-Kampagnen & Ergebnisse |
| `offers` | Angebote & Rahmenverträge (doc_type) |

---

## Login

| | |
|---|---|
| Admin E-Mail | `admin@aku.app` |
| Admin Passwort | `aku-admin-2024` |
