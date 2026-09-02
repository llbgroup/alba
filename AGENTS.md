# Alba — für AI-Agenten

Du richtest Alba auf der Maschine des Menschen ein. Du installierst nicht still die Chrome-PWA — das ist ein Klick, den nur der Mensch tun kann.

Repo: `https://github.com/llbgroup/alba`
App: `https://llbgroup.github.io/alba/`
Lokal: `http://127.0.0.1:4765/` — Port und Host fest. Anderer Ursprung = leeres `localStorage`.

## Auftrag: einrichten (für einen Menschen)

1. Browser: `https://llbgroup.github.io/alba/`
2. **PWA:** Chrome unten rechts „Als App“. Safari: Ablage → Zum Dock. Du kannst den Install-Dialog nicht klicken.
3. Nicht klonen, außer der Mensch will entwickeln.

## Auftrag: lokal entwickeln

1. `git clone https://github.com/llbgroup/alba.git`
2. `npm install` und `npm run dev`
3. `http://127.0.0.1:4765/` — nicht den Port wechseln.
4. Leere App bekommt ein paar Attrappen. Wer schon Daten hat, bleibt. `fillDemo(true)` nur nach Frage.

## Auftrag: aktualisieren

```bash
cd <alba>
git pull --ff-only
npm install
```

Nur für die lokale Kopie. Die Website `https://llbgroup.github.io/alba/` aktualisiert sich beim nächsten Öffnen von selbst (Push auf `main` → Pages).

```bash
npm run update
```

ist dasselbe.

## Daten — nicht anfassen, nicht committen

| Key | Wo | Git |
|---|---|---|
| `alba.v1` | localStorage, App-Stand, `version: 3` | nein |
| `alba.sky.v1` | Eigenes Himmelbild | nein |
| `alba.xai.v1` | xAI-Schlüssel | nein |
| `alba.idea.v1` | Zuletzt offene Idee | nein |
| `alba.demo.v1` | Beispiel schon geladen | nein |
| `journal/*.md` | Datei, via `POST /api/journal` | gitignore (README/INDEX bleiben) |

`git pull` ändert Code, nicht den Browser. Export/Import unter Einstellungen.

Nicht: `localStorage.clear`, Port ändern, `fillDemo` ohne Frage, Journal committen, Onboarding zurückbauen, Firmen ins Seed.

## Produkt (kurz)

Heute = Arbeit. To-do = Plan (Neu ohne Datum, Geplant mit). Routinen ≤ 5, Anker Pflicht, Mini zählt, Abhaken auf Heute. Ziele = Sätze Jahr/Monat/Woche. Ideen = Dokumente, To-dos im Text. Log = Speicher. Tag ist Filter, kein Ordner. Nav: Heute, To-do, Routinen, Ziele, Ideen, Log.

Menschliche Anleitung: `ANLEITUNG.md` (in der App unter Einstellungen speicherbar). Modell: `STAND.md`. Sync-Vertrag für später: `docs/SYNC.md`.

## Stack

Vite 8 + React 19, SPA, Hash-Routing `#/today` `#/todo` `#/aims` `#/ideas` `#/habits` `#/log` `#/settings`. PWA: `public/manifest.json`, `public/sw.js`, PNG 192/512. SW: Netz zuerst für HTML, `/src/` und `/@vite` unangetastet.

## Wenn etwas schiefgeht

- Leere App nach gestern voll: Port oder Host anders, oder anderes Browserprofil.
- Kein Install-Chip: noch kein Service Worker (einmal neu laden), oder Safari, oder schon installiert, oder „Später“ in dieser Sitzung.
- `EADDRINUSE 4765`: alten Vite-Prozess beenden, nicht den Port ändern.
