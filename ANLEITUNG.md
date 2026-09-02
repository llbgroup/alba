# Alba — Anleitung

Persönliches Betriebssystem für den Tag. Kein Konto, keine Wolke. Alles bleibt auf diesem Gerät.

## Einrichten

Der GitHub-Link allein installiert nichts. So gibst du Alba weiter:

1. Im privaten Repo die Person als Collaborator einladen (GitHub → Settings → Collaborators).
2. Sie klont das Repo — oder gibt den Link ihrer AI, die `AGENTS.md` liest.
3. `npm install` und `npm run dev`.
4. Öffnen: `http://127.0.0.1:4765/` — **diesen Port nicht ändern.** Ein anderer Port ist ein leeres Konto.
5. Chrome: unten rechts **Als App**. Safari: Ablage → Zum Dock.

Ohne Einladung sieht sie das Repo nicht. Ohne Dev-Server auf ihrem Rechner gibt es keine PWA. Ihre Daten liegen nur bei ihr.

Safari (Mac): Ablage → Zum Dock hinzufügen. iPhone: Teilen → Zum Home-Bildschirm (nicht über `127.0.0.1` vom Telefon).

## Die Flächen

| | |
|---|---|
| **Heute** | Der Tag. Abhaken, Highlight, Routinen, abends erzählen. |
| **To-do** | Planen. Ohne Datum = Neu. Mit Datum = Geplant, als Timeline. |
| **Ziele** | Ein Satz für Jahr, Monat, Woche. Kein Ordner. |
| **Ideen** | Dokumente. To-dos sitzen im Text und unter To-do. |
| **Routinen** | Höchstens fünf. Anker Pflicht. Abhaken nur auf Heute. Mini zählt. |
| **Log** | Was der Tag gehalten hat. Nachlesen, nicht planen. |
| **Einstellungen** | Name, Thema, Himmel, xAI-Schlüssel, Export, Beispiel. |

Ablegen: `C` oder `N` oder `⌘K`.

Eine Idee ist eine Notiz, keine Karte. Die Kette in der Leiste ist ein Weblink. To-dos sucht das Feld zuerst unter den offenen, sonst legt es neu an.

## Daten

Im Browser (`localStorage`), Ursprung `http://127.0.0.1:4765`. Git enthält den Code, nicht dein Leben.

Einstellungen → Export JSON nimmt den Stand mit. Import ersetzt. Journal-Markdown liegt zusätzlich unter `journal/` auf der Platte, solange der Dev-Server läuft.

Beim ersten leeren Start liegen ein paar Attrappen (ein Highlight, drei To-dos, eine Idee, zwei Ziele, eine Routine). Einstellungen → Beispieldaten laden ersetzt den Stand — vorher exportieren.

## Aktualisieren

Ein Push auf GitHub ändert **nicht** die installierte App. Es gibt kein Update-Popup und keine Neu-Installation. Jede Maschine holt den Code selbst:

```bash
npm run update
```

Dev-Server neu, Seite einmal neu laden. Das Dock-Symbol bleibt. Die PWA zeigt weiterhin `http://127.0.0.1:4765/` — denselben lokalen Server, nicht GitHub.

Damit alle still denselben Stand hätten, müsste Alba unter einer HTTPS-Adresse liegen. Das ist noch nicht so.

## Mehrere Geräte

Noch nicht. Ein Gerät, ein Browser-Profil. Umzug: Export, auf dem anderen Gerät Import.

Ein Konto mit Abgleich (geplant: Supabase) ist vorbereitet im Datenmodell, aber nicht eingebaut. xAI-Schlüssel und UI-Kram bleiben lokal, auch dann.
