# Alba

Persönliches Betriebssystem für den Tag. To-dos datieren, auf Heute abhaken, Ziele als Sätze, Ideen als Dokumente, speichern im Log, Routinen halten.

Daten bleiben im Browser (`localStorage`). Kein Konto, keine Wolke. Journal-Markdown zusätzlich unter `journal/`. Export unter Einstellungen.

Beim ersten leeren Start ein paar Attrappen, die die Flächen erklären. Name, Thema und Himmel liegen unter Einstellungen. **Beispieldaten laden** ersetzt den Stand.

**Port 4765 nicht ändern.** Der Ursprung `http://127.0.0.1:4765` hält den Stand. Ein anderer Port ist ein leeres Konto. `git pull` aktualisiert den Code, nicht die Daten im Browser.

## Start

```bash
npm install
npm run dev
```

Öffnen: [http://127.0.0.1:4765/](http://127.0.0.1:4765/)

## Als App installieren

Chrome und Edge: Chip **unten rechts**, oder das Install-Symbol in der Adresszeile. Safari (Mac): Ablage → Zum Dock hinzufügen. iPhone: Teilen → Zum Home-Bildschirm.

## Weitergeben

Nicht nur den Link. Person als Collaborator einladen, sie klont (oder ihre AI liest `AGENTS.md`), `npm run dev`, dann den Chip. Jede Installation ist lokal, mit eigenen Daten.

## Anleitung

- Mensch: **[ANLEITUNG.md](ANLEITUNG.md)** — in der App unter Einstellungen speicherbar.
- AI: **[AGENTS.md](AGENTS.md)** — den GitHub-Link einer AI geben, sie setzt auf. Die PWA-Installation im Browser kann sie nicht klicken.
- Weitermachen: **[STAND.md](STAND.md)**. Späterer Sync: **[docs/SYNC.md](docs/SYNC.md)**.

## Aktualisieren

Kein Popup, keine Neu-Installation. GitHub-Push kommt nicht von allein. Jede Maschine:

```bash
npm run update
```

(`git pull --ff-only && npm install`). Dev-Server neu, Seite neu laden.
