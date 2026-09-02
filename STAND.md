# Alba — Stand zum Weitermachen

Stand: 2. September 2026. Ordner: `~/Claude/alba`. Kein Cloud-Sync.

## Starten

```bash
cd ~/Claude/alba
npm run dev
```

Öffnen: `http://127.0.0.1:4765/`

Vite ist auf **Port 4765** und `127.0.0.1` festgelegt (`vite.config.js`, `strictPort`). Grund: `localStorage` hängt am Origin. Anderer Port = leere App.

Stack: Vite 8 + React 19, SPA, Hash-Routing (`#/today`, `#/board`, `#/aims`, `#/ideas`, `#/habits`, `#/log`, `#/settings`). `#/plan` / `#/ziele` → Ziele, `#/journal` → Log.

## Wofür die App da ist

| Fläche | Rolle |
|---|---|
| **To-do** | Planen. Nur To-dos: **Neu** und **Geplant** als Timeline (Heute, Morgen, Diese Woche, Nächste Woche, später). Hash `#/board` oder `#/todo`. |
| **Heute** | Arbeiten. Flache Checkliste. Erledigtes bleibt durchgestrichen unten. Routinen ebenfalls durchgestrichen, wenn gehalten. Fokus-Timer, abends erzählen. |
| **Ziele** | Jahr zuerst (mehr als 3, Rest hinter Fade). Dann Jahr im Blick, Monatsziele, Wochenraster (ein Satz/Woche). Tag und Kurztext immer sichtbar. |
| **Ideen** | Dokument. Formatzeile als klebende Glasbox oben in der Spalte (H2, To-do, AI, Mikro, Tag, Löschen). Diktat live. AI korrigiert/formuliert. To-dos sitzen im Text und im To-do-Tab. |
| **Log** | Speicher als Tagesliste. Jeder Tag ein Blatt: Heute zählt, Abend, erledigte To-dos, Routinen, Angelegtes. Hash `#/log/YYYY-MM-DD`. |
| **Routinen** | Design: Anker Pflicht, max. 5. Abhaken nur auf Heute. |

Nicht: Karten, Sortierung nach Projekt. Projekt ist ein **Tag**. Ein Ziel ist ein Satz, kein Container.

## Modell

**To-do** ist das einzige Planungsobjekt. Ohne Datum liegt es unter Neu. Mit Datum unter Geplant, chronologisch. Ein Tag (früher: Projekt) ist optional und gruppiert nichts — er filtert und färbt.

**Heute** zeigt nur den Tag (plus offenes Überfälliges dieser Woche). Offene To-dos oben, erledigte durchgestrichen darunter. Routinen: gehaltene nach unten, durchgestrichen.

**Ideen** sind Dokumente. Prosa (Überschriften, Fett, Listen, Bilder) und darunter To-dos — neu anlegen, Datum setzen, oder bestehende suchen und verknüpfen. Dieselben Tasks liegen unter To-do. Mülleimer in der Notiz löst die Verknüpfung, löscht die Aufgabe nicht.

**Ziele** sind Sätze auf drei Horizonten. Umschreiben ist die Hauptaktion. Tag nur als Pip. Die Woche erscheint als eine Zeile auf Heute.

Alte Wochenkarten aus v2 werden beim Laden nach v3 gezogen: leere Karten werden To-dos, Karten mit Notiz und Kindern werden Ideen, erledigte Wochen bleiben im Log.

## Heute — Layout

Hero (dunkleres Glas):

1. **Datum** — einziges großes Gewicht (Zahl).
2. **Timer** oben rechts, groß, Button „Timer setzen“ solange nichts läuft. Klick auf Uhr oder Button → Fokus-Sheet.
3. **Zitat** — Caption, 16–20px, leiser. Jeden Tag ein anderes (`quoteFor(date)`), Tippen wechselt (`quoteShift`). Nicht mit „Heute zählt“ konkurrieren.
4. **Heute zählt** — dein Satz für den Tag, große Fraunces-Zeile (Arbeit, nicht Dekor).
5. Unten **Abend**: großes Mikrofon. Tippen, erzählen, nochmal tippen → CloseDay-Sheet, Eintrag landet im Log. „Oder schreiben“ geht auch.

Überfällige To-dos **dieser Woche** liegen in der Heute-Liste. Das Modal „Gestern ist nicht heute“ öffnet **nicht** von allein — nur über den Hinweis, und nur für älter als diese Woche.

Himmel bleibt beim Scrollen stehen (`.stage-sky` fest, Inhalt in `.stage-scroll`).

## Chrome

- Sidebar `#0a0b0d`, immer Icon-Rail. Hover/Fokus zeigt das Label rechts als Glas-Chip. Kein Ausklappen.
- Rechte Fläche: abgerundetes Fenster (18px), Rahmen in Menüfarbe, Himmel nur darin.
- Modals: kein türkiser Balken oben links.

## Daten

| Key | Inhalt |
|---|---|
| `alba.v1` | App-Stand (Tags, Tasks, Ideen, Routinen, Journal, Tage). `version: 3` |
| `alba.sky.v1` | Eigenes Hintergrundbild (Data-URL) |
| `alba.demo.v1` | Beispieldaten schon geladen |
| `alba.idea.v1` | Zuletzt offene Idee |
| `alba.xai.v1` | xAI-Schlüssel für Umschreiben in Ideen (Einstellungen). Nicht im App-Stand. |

Journal zusätzlich als Datei: `~/Claude/alba/journal/YYYY-MM-DD.md` via `POST /api/journal` (Vite-Plugin in `vite.config.js`, braucht `configureServer`). Einstieg für spätere Suche mit Grok: `journal/README.md` und `journal/INDEX.md`.

Abend-Close schreibt denselben Tag ins Journal (`source: 'evening'`, Update statt Duplikat).

## Wichtige Dateien

```
src/App.jsx                 Routing, Sky an Shell, Install-Chip. Leere App: ein paar Attrappen, einmal.
AGENTS.md                   Auftrag für eine AI, die den GitHub-Link bekommt
ANLEITUNG.md                Für Menschen, speicherbar unter Einstellungen
src/store.js                State, localStorage, logDays(), plannedGroups()
src/seed.js                 Wenige Attrappen: 3 To-dos, 1 Idee, 2 Ziele, 1 Routine. Keine Firmen.
public/sw.js                Service Worker (Netz zuerst für HTML, Vite-Dev unangetastet)
public/manifest.json        PWA, PNG 192/512 + maskable
src/index.css               Chrome, Board, Hero, Ideen, Log
src/components/Shell.jsx    Sidebar, Collapse, Stage+Sky
src/components/FocusTimer.jsx
src/components/CloseDay.jsx Abend-Sheet, nimmt seed vom Mikro
src/views/Today.jsx
src/views/Board.jsx         Zwei Spalten: Neu / Geplant-Timeline
src/views/Aims.jsx          Jahr, Monat, Woche — Sätze
src/views/Ideas.jsx         Notizen-Übersicht + Editor
src/views/Log.jsx           Tagesliste + Tagesblatt
src/views/Habits.jsx        Routinen-Studio
src/views/Journal.jsx       re-export → Log
src/lib/quotes.js           Tageszitat
src/lib/dates.js            ISO-Wochen
src/lib/xaiKey.js           xAI-Schlüssel in localStorage
src/lib/rewrite.js          POST /api/rewrite
vite.config.js              Journal + Rewrite-Proxy (grok-4.6)
```

## Entscheidungen (nicht zurückdrehen ohne Grund)

- Orange Accent → Eisblau-Gradient `--terra: #8fc8dc`, `--accent-grad`.
- Max 3 MITs, max 5 Routinen, Anker Pflicht.
- Routinen: B=MAP / tiny / never-miss-twice / Dichte statt Streaks.
- Board zeigt To-dos, keine Karten. Tag ist Filter, nicht Ordner.
- Löschen immer als Mülleimer, nicht als „Weg“.
- Log ist Speicher, To-do ist Planung, Heute ist Arbeit, Ziele sind Richtung, Ideen sind Denken.

## Offenes / nächster Blick

- Log-Tage entstehen aus Heute (abhaken, Abend, Highlight) plus angelegte Ideen/To-dos. Kein freies Schreiben im Log selbst.
- Tags lassen sich anlegen, aber noch nicht archivieren (außer über Altbestand im Log).
- Carry-Over-Modal existiert noch, startet aber nicht mehr automatisch.
- Kein Onboarding. Leere App ist nutzbar. Name/Thema/Routinen unter Einstellungen.
- Beispieldaten: einmal, nur wenn der Stand leer ist. Sonst Einstellungen → Beispieldaten laden.
- PWA: Manifest, PNG-Icons, Service Worker, Apple-Touch-Icon. Chrome: Chip unten rechts (`beforeinstallprompt`). Safari: Dock / Home-Bildschirm.
- Anleitung: `ANLEITUNG.md` (Mensch), `AGENTS.md` (AI richtet ein, kann die PWA nicht still installieren). Sync-Vertrag: `docs/SYNC.md`.
- Live: GitHub Pages. Push auf main deployt. Installierte App aktualisiert sich beim nächsten Öffnen.
- `src/views/Plan.jsx`, `Goals.jsx`, `Later.jsx`, `Week.jsx` sind Altlast, nicht in der Nav.
- Ideen-AI braucht einen xAI-Schlüssel (Einstellungen oder `XAI_API_KEY` / `.env.local`). Vite nach Plugin-Änderung neu starten, Port 4765.

## Git

Repo: `llbgroup/alba` (öffentlich). Live: `https://llbgroup.github.io/alba/` via GitHub Pages (`ALBA_BASE=/alba/`). Push auf `main` deployt. PWA lädt den neuen Stand beim nächsten Öffnen. Lokal bleibt Port 4765, anderer Ursprung, anderer Speicher. Journal-Markdown nur am Dev-Server.
