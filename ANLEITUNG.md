# Alba — Anleitung

Persönliches Betriebssystem für den Tag. Kein Konto, keine Wolke. Alles bleibt auf diesem Gerät.

## Einrichten

Adresse: [https://llbgroup.github.io/alba/](https://llbgroup.github.io/alba/)

1. Link öffnen.
2. Chrome: unten rechts **Als App**. Safari: Ablage → Zum Dock.
3. Fertig. Ihre Daten bleiben in ihrem Browser.

Zum Entwickeln lokal: `npm install` und `npm run dev` auf `http://127.0.0.1:4765/` — **diesen Port nicht ändern.** Das ist ein anderes Konto als die Website.

Safari (Mac): Ablage → Zum Dock hinzufügen. iPhone: Teilen → Zum Home-Bildschirm (nicht über `127.0.0.1` vom Telefon).

## Die Flächen

| | |
|---|---|
| **Heute** | Der Tag. Abhaken, Highlight, Routinen, abends erzählen. |
| **To-do** | Planen. Ohne Datum = Neu. Mit Datum = Geplant, als Timeline. |
| **Routinen** | Höchstens fünf. Anker Pflicht. Abhaken nur auf Heute. Mini zählt. |
| **Ziele** | Ein Satz für Jahr, Monat, Woche. Kein Ordner. |
| **Ideen** | Dokumente. To-dos sitzen im Text und unter To-do. |
| **Log** | Was der Tag gehalten hat. Nachlesen, nicht planen. |
| **Einstellungen** | Name, Thema, Himmel, xAI-Schlüssel, Export, Beispiel. |

Ablegen: `C` oder `N` oder `⌘K`.

Eine Idee ist eine Notiz, keine Karte. Die Kette in der Leiste ist ein Weblink. To-dos sucht das Feld zuerst unter den offenen, sonst legt es neu an.

## Daten

Im Browser (`localStorage`), Ursprung `http://127.0.0.1:4765`. Git enthält den Code, nicht dein Leben.

Einstellungen → Export JSON nimmt den Stand mit. Import ersetzt. Journal-Markdown liegt zusätzlich unter `journal/` auf der Platte, solange der Dev-Server läuft.

Beim ersten leeren Start liegen ein paar Attrappen (ein Highlight, drei To-dos, eine Idee, zwei Ziele, eine Routine). Einstellungen → Beispieldaten laden ersetzt den Stand — vorher exportieren.

## Aktualisieren

Die Website aktualisiert sich selbst. Ein Push auf `main` geht live. Beim nächsten Öffnen der App (oder des Tabs) kommt der neue Stand — ohne neu zu installieren, ohne Popup.

Wer lokal mit `npm run dev` arbeitet, zieht weiter selbst: `npm run update`.

## Mehrere Geräte

Noch nicht. Ein Gerät, ein Browser-Profil. Umzug: Export, auf dem anderen Gerät Import.

Ein Konto mit Abgleich (geplant: Supabase) ist vorbereitet im Datenmodell, aber nicht eingebaut. xAI-Schlüssel und UI-Kram bleiben lokal, auch dann.
