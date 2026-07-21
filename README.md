# Aku CRM – Akquise & Angebote

Electron-App für Zeitblick Personalservice. CRM für Akquiseanrufe, E-Mail-Marketing und Angebotserstellung.

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
| Datenbank | PostgreSQL (Remote-Server) |
| Updates | electron-updater (automatisch via GitHub Releases) |

---

## Projektstruktur

```
aku-crm/
├── electron/
│   ├── main.js          # Electron Main Process, alle IPC-Handler, DB-Verbindung
│   └── preload.js       # contextBridge – exposte API ans Frontend
├── src/
│   ├── App.jsx          # Root-Komponente, View-Routing, Dark Mode, globaler State
│   ├── main.jsx         # React-Einstiegspunkt
│   ├── index.css        # Tailwind-Basis + Dark Mode CSS
│   └── components/
│       ├── AngeboteModule.jsx     # Angebote erstellen, bearbeiten, PDF-Export
│       ├── Settings.jsx           # Einstellungen (Profil, Dark Mode, Sprache, Benachrichtigungen, E-Mail)
│       ├── Sidebar.jsx            # Navigation + Kontaktliste
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

### CRM Akquise
- Kontaktverwaltung mit Status-Tracking (10 Stufen: Nicht kontaktiert → Aktiver Kunde)
- Follow-up Erinnerungen mit Überfälligkeits-Anzeige
- Anrufsession: sequentielles Durcharbeiten von Kontaktlisten
- Aktivitätslog pro Kontakt
- CSV-Import / Export
- Dokumentenanhänge pro Kontakt
- Kundensuche via OpenStreetMap / Overpass API (mit 3 Fallback-Servern)

### E-Mail Marketing
- Kampagnen mit Rich-Text-Editor (HTML)
- SMTP-Versand direkt aus der App (via Nodemailer)
- Kampagnen-Ergebnisse werden gespeichert

### Angebote
- Angebotsliste mit Status (Entwurf, Verschickt, Angenommen, Abgelehnt)
- **Einrichtungstyp-Auswahl** – passt Texte und Stundensätze automatisch an:
  - 🏠 Pflegeheim / Seniorenzentrum
  - 🏥 Krankenhaus / Klinik
  - 🚗 Ambulanter Pflegedienst
  - 🏋️ Reha-Klinik
  - 🧠 Psychiatrie / Sozialpsychiatrie
  - ♿ Behinderteneinrichtung / Eingliederungshilfe
- Empfänger aus CRM-Kontakten auswählen (Auto-Fill)
- Live-Vorschau (A4-skaliert)
- PDF-Export via Electron `printToPDF`

### Einstellungen
- **Profilbild** hochladen (lokal gespeichert)
- **Dark Mode** – dunkles Design
- **Sprache** – Deutsch, English, Türkçe
- **Benachrichtigungen** – Follow-ups, E-Mail, Ton
- **E-Mail Konto** – SMTP-Konfiguration (Outlook, Gmail, GMX etc.)

### Admin
- Benutzerverwaltung (Passwort zurücksetzen, löschen)
- Touch ID Login (macOS)

### Automatische Updates
- App prüft beim Start ob eine neue Version verfügbar ist
- Download läuft im Hintergrund
- Banner zeigt Update-Status, Neustart installiert die neue Version

---

## Datenbank-Schema

| Tabelle | Inhalt |
|---|---|
| `users` | CRM-Nutzer, Auth, Einstellungen |
| `contacts` | Akquise-Kontakte mit Status & Follow-up |
| `call_history` | Anrufprotokolle |
| `email_campaigns` | E-Mail-Kampagnen & Ergebnisse |
| `offers` | Angebote (Zeitblick-Template, alle Typen) |
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
