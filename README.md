# Aku CRM – Akquise & Angebote

Electron-App für Zeitblick Personalservice. CRM für Akquiseanrufe, E-Mail-Marketing, Angebots- und Rahmenvertragserstellung.

---

## Download

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
| Backend | Electron (Main Process) |
| Datenbank | PostgreSQL (Remote-Server via Hetzner/Coolify) |
| Updates | electron-updater (automatisch via GitHub Releases) |

---

## Projektstruktur

```
aku-crm/
├── electron/
│   ├── main.js          # Electron Main Process, alle IPC-Handler, DB-Verbindung
│   └── preload.js       # contextBridge – exposte API ans Frontend
├── src/
│   ├── App.jsx          # Root-Komponente, View-Routing, Navigation-History, globaler State
│   ├── main.jsx         # React-Einstiegspunkt
│   ├── index.css        # Tailwind-Basis + Dark Mode CSS
│   └── components/
│       ├── KundenCRM.jsx          # Kunden & CRM – Kontaktliste, Pipeline, Berichte
│       ├── BelegeModule.jsx       # Belege-Übersicht (Angebote + Rahmenverträge)
│       ├── AngeboteModule.jsx     # Angebote erstellen, bearbeiten, PDF-Export
│       ├── RahmenvertragModule.jsx # Rahmenverträge erstellen und verwalten
│       ├── Settings.jsx           # Einstellungen (Profil, Firmenprofil, E-Mail, Darstellung)
│       ├── Sidebar.jsx            # Hauptnavigation (Dashboard, Kunden, Belege, Aktionen)
│       ├── Dashboard.jsx          # Übersicht, Statistiken
│       ├── ContactProfile.jsx     # Kontakt-Detailansicht
│       ├── ContactForm.jsx        # Kontakt anlegen / bearbeiten
│       ├── CallList.jsx           # Anruflisten-Auswahl
│       ├── CallSession.jsx        # Aktive Anrufsession
│       ├── FindCustomers.jsx      # Kundensuche via Overpass API (3 Fallback-Server)
│       ├── EmailMarketing.jsx     # E-Mail-Kampagnen
│       ├── AdminPanel.jsx         # Benutzerverwaltung
│       ├── Login.jsx              # Login + Touch ID
│       └── WindowsTitleBar.jsx    # Windows Titelleiste
├── assets/
│   └── icon.icns
├── config.json          # DB-Zugangsdaten (nicht in Git, wird ins DMG eingebettet)
├── .env.example         # Vorlage für Entwickler
└── package.json
```

---

## Features

### Kunden & CRM
- Kontaktverwaltung mit Status-Tracking (10 Stufen: Nicht kontaktiert → Aktiver Kunde)
- Einrichtungstyp-Tags (Krankenhaus, Pflegeheim, Ambulante Pflege, Reha Klinik, Betreutes Wohnen)
- Pipeline-Ansicht (Kanban nach Status)
- Follow-up Erinnerungen mit Überfälligkeits-Anzeige
- Anrufsession: sequentielles Durcharbeiten von Kontaktlisten
- Aktivitätslog pro Kontakt
- CSV-Import / Export
- Dokumentenanhänge pro Kontakt
- Kundensuche via OpenStreetMap / Overpass API (mit 3 Fallback-Servern)

### E-Mail Marketing
- Kampagnen mit Rich-Text-Editor (HTML)
- SMTP-Versand direkt aus der App (via Nodemailer)
- Provider-Vorlagen: Outlook, Gmail, GMX, Web.de, Strato, IONOS, eigener SMTP
- Kampagnen-Ergebnisse werden gespeichert

### Belege
- **Angebote** – Erstellen, bearbeiten, PDF-Export mit Firmenprofil
  - Einrichtungstyp-Auswahl passt Texte und Stundensätze automatisch an
  - Empfänger aus CRM-Kontakten auswählen (Auto-Fill)
  - Live-Vorschau (A4-skaliert)
  - PDF-Export via Electron `printToPDF`
- **Rahmenverträge** – Individuelle Verträge pro Kunde
  - Vertragsspezifische Felder (Laufzeit, Kündigungsfrist, Konditionen)
  - Automatische Nummernvergabe (RV-YYYY-NNN)
- Status-Tracking: Entwurf, Verschickt, Angenommen, Abgelehnt
- Finanzübersicht: Offene Angebote, Angenommene Summen

### Einstellungen
- **Mein Profil** – Name, E-Mail, Standort, Profilbild
- **Firmenprofil** – Logo, Firmenname, Adresse, Kontaktdaten (wird automatisch in Angebots-PDFs übernommen)
- **E-Mail Konto** – SMTP-Konfiguration (Strato, Outlook, Gmail, GMX, Web.de, IONOS, eigener Server)
- **Anrufe** – Anrufeinstellungen
- **Darstellung** – Hell/Dunkel-Modus
- **Sprache** – Deutsch, English, Türkçe
- **Backup & Daten** – Datenexport

### Admin
- Benutzerverwaltung (Passwort zurücksetzen, löschen)
- Touch ID Login (macOS)

### Navigation
- Globaler Zurück-Button mit View-History (navigiert immer zur vorherigen Seite)
- Sidebar: Dashboard, Kunden & CRM, Belege, Aktionen (Kunden finden, Anrufsession, E-Mail Marketing)

### Automatische Updates
- App prüft beim Start ob eine neue Version verfügbar ist
- Download läuft im Hintergrund
- Banner zeigt Update-Status, Neustart installiert die neue Version

---

## Datenbank-Schema

| Tabelle | Inhalt |
|---|---|
| `users` | CRM-Nutzer, Auth, Einstellungen, E-Mail-Konfiguration |
| `contacts` | Akquise-Kontakte mit Status, Follow-up & Einrichtungstyp |
| `call_history` | Anrufprotokolle |
| `email_campaigns` | E-Mail-Kampagnen & Ergebnisse |
| `offers` | Angebote & Rahmenverträge (doc_type: angebot/rahmenvertrag) |
| `documents` | Datei-Anhänge pro Kontakt |

---

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# .env anlegen (nach .env.example)
cp .env.example .env

# Dev-Modus (Vite + Electron gleichzeitig, Hot Reload)
npm run dev

# Produktion bauen + DMG erstellen
npm run dist
```

### Neue Version veröffentlichen
1. Version in `package.json` erhöhen (z.B. `1.0.1`)
2. `npm run dist` ausführen
3. Apps ad-hoc signieren:
   ```bash
   codesign --deep --force --sign - "dist/mac-arm64/Aku CRM.app"
   codesign --deep --force --sign - "dist/mac/Aku CRM.app"
   ```
4. DMGs neu erstellen:
   ```bash
   hdiutil create -volname "Aku CRM" -srcfolder "dist/mac-arm64/Aku CRM.app" -ov -format UDZO "dist/Aku CRM-1.0.1-arm64.dmg"
   hdiutil create -volname "Aku CRM" -srcfolder "dist/mac/Aku CRM.app" -ov -format UDZO "dist/Aku CRM-1.0.1.dmg"
   ```
5. GitHub Release erstellen und DMGs + `latest-mac.yml` + `.blockmap` hochladen
6. Alle Nutzer bekommen das Update automatisch beim nächsten App-Start

---

## Login

| | |
|---|---|
| Admin E-Mail | `admin@aku.app` |
| Admin Passwort | `aku-admin-2024` |
