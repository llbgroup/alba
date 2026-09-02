# Alba — Anleitung

Persönliches Betriebssystem für den Tag. Kein Konto, keine Wolke. Alles bleibt auf diesem Gerät.

## Einrichten

1. Repo klonen (privat: Zugriff auf `llbgroup/alba` braucht es).
2. Im Ordner: `npm install` und `npm run dev`.
3. Öffnen: `http://127.0.0.1:4765/` — **diesen Port nicht ändern.** Ein anderer Port ist ein leeres Konto.
4. In Chrome erscheint unten rechts **Als App**. Ein Klick, eigenes Fenster, ohne Browserleiste.

Oder den GitHub-Link einer AI geben. Sie liest `AGENTS.md` und setzt auf. Die PWA-Installation im Browser kann sie nicht klicken — das bleibt ein Tipp.

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

Beispieldaten unter Einstellungen sind Attrappen, die die Flächen erklären. Sie ersetzen To-dos, Ideen, Ziele und Routinen — vorher exportieren.

## Aktualisieren

GitHub-Push kommt **nicht** von allein auf dein Gerät. Code holen:

```bash
git pull
npm install
```

Dev-Server neu, Seite neu laden. Die installierte App zeigt denselben lokalen Server — sie zieht nicht still vom GitHub.

Damit alle denselben Stand ohne Ziehen hätten, müsste Alba unter einer HTTPS-Adresse liegen. Das ist noch nicht so.

## Mehrere Geräte

Noch nicht. Ein Gerät, ein Browser-Profil. Umzug: Export, auf dem anderen Gerät Import.

Ein Konto mit Abgleich (geplant: Supabase) ist vorbereitet im Datenmodell, aber nicht eingebaut. xAI-Schlüssel und UI-Kram bleiben lokal, auch dann.
