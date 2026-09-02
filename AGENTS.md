# Alba — für AI-Agenten

Du richtest Alba auf der Maschine des Menschen ein. Du installierst nicht still die Chrome-PWA — das ist ein Klick, den nur der Mensch tun kann.

Repo (privat): `https://github.com/llbgroup/alba`
App: `http://127.0.0.1:4765/`
Port **4765** und Host **127.0.0.1** sind fest (`vite.config.js`, `strictPort`). Anderer Ursprung = leeres `localStorage`.

## Auftrag: einrichten

1. `gh auth status`. Ohne Leserecht auf `llbgroup/alba` bricht ab und sagst, der Mensch muss dich einladen oder `gh auth login` mit `repo`.
2. Fehlt der Ordner: `gh repo clone llbgroup/alba` (oder `git clone https://github.com/llbgroup/alba.git`) in den Arbeitsordner, den der Mensch für lokale Tools nutzt.
3. `cd alba && npm install`
4. Läuft schon etwas auf 4765? Nicht den Port wechseln — den Prozess identifizieren, nicht einen zweiten Server auf 4766 starten.
5. `npm run dev`
6. Browser: `http://127.0.0.1:4765/`
7. **PWA:** Chrome/Edge feuern `beforeinstallprompt`. Die App zeigt unten rechts „Als App“. Sag: dort Installieren, oder das Symbol in der Adresszeile. Safari: Ablage → Zum Dock. Du kannst `beforeinstallprompt` nicht ohne User-Geste abschließen. Nicht mit Puppeteer, nicht mit Chrome-Flags, nicht mit `chrome://` herumschlagen.
8. Leere App bekommt ein paar Attrappen (Funktionen, kein Leben). Wer schon Daten hat, bleibt unangetastet. `fillDemo(true)` nur nach Frage. Name/Thema unter Einstellungen.
9. **Weitergeben:** Collaborator einladen, dann klonen. Der Link allein reicht nicht — privates Repo, lokale PWA.

## Auftrag: aktualisieren

```bash
cd <alba>
git pull --ff-only
npm install
```

Dev-Server neu starten, Seite neu laden. GitHub-Push aktualisiert niemanden automatisch. Jede Maschine zieht selbst. Die installierte PWA zeigt weiterhin localhost, nicht GitHub.

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

Heute = Arbeit. To-do = Plan (Neu ohne Datum, Geplant mit). Ziele = Sätze Jahr/Monat/Woche. Ideen = Dokumente, To-dos im Text. Routinen ≤ 5, Anker Pflicht, Mini zählt, Abhaken auf Heute. Log = Speicher. Tag ist Filter, kein Ordner.

Menschliche Anleitung: `ANLEITUNG.md` (in der App unter Einstellungen speicherbar). Modell: `STAND.md`. Sync-Vertrag für später: `docs/SYNC.md`.

## Stack

Vite 8 + React 19, SPA, Hash-Routing `#/today` `#/todo` `#/aims` `#/ideas` `#/habits` `#/log` `#/settings`. PWA: `public/manifest.json`, `public/sw.js`, PNG 192/512. SW: Netz zuerst für HTML, `/src/` und `/@vite` unangetastet.

## Wenn etwas schiefgeht

- Leere App nach gestern voll: Port oder Host anders, oder anderes Browserprofil.
- Kein Install-Chip: noch kein Service Worker (einmal neu laden), oder Safari, oder schon installiert, oder „Später“ in dieser Sitzung.
- `EADDRINUSE 4765`: alten Vite-Prozess beenden, nicht den Port ändern.
