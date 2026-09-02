# Alba — Datenvertrag für späteren Sync

Noch kein Konto, noch kein Server für den Stand. Das Modell ist so geschnitten, dass ein Sync (z. B. Supabase) andocken kann, ohne die Flächen umzubauen.

## Ein Dokument

Quelle der Wahrheit: `localStorage['alba.v1']`, ein JSON, `version: 3`. `migrate()` zieht ältere Stände nach. IDs sind Client-UUIDs (`crypto.randomUUID`). Jede Mutation setzt `updatedAt` (ISO). `createdAt` einmalig.

`exportState` / `importState` ist derselbe Blob. Ein erster Sync darf genau das hoch- und runterladen (last-write-wins auf dem ganzen Dokument). Für gleichzeitiges Tippen auf zwei Geräten reicht das später nicht — dann `updatedAt` pro Record und Merge.

## Was mitwandert

`profile` (ohne Geräte-UI), `areas`, `tasks`, `ideas`, `aims`, `habits`, `habitLogs`, `days`, `journalEntries`, `reviews`, `weekGoals`, `themes`, `goals`.

Himmel-Bild (`alba.sky.v1`) ist eine Data-URL, oft zu groß für eine Row — später Storage-Bucket, nicht die JSON-Row.

## Was lokal bleibt

| Key | Grund |
|---|---|
| `alba.xai.v1` | Schlüssel, nie in die Wolke |
| `alba.idea.v1` | Welche Notiz offen ist |
| `alba.demo.v1` | Ob das Beispiel schon lag |
| `alba.install.hide` | Install-Chip |

Journal-Dateien unter `journal/` sind ein Schatten von `journalEntries`, nur solange der Vite-Dev-Server `POST /api/journal` anbietet. Gehostete PWA hat das Plugin nicht. Sync liest und schreibt `journalEntries` im Blob, nicht die Markdown-Files.

## Supabase, wenn es soweit ist

1. Auth (Magic Link reicht). Eine Row pro User: `stand jsonb`, `updated_at timestamptz`.
2. Beim Start: lokal vs. Server, neueres `updatedAt` gewinnt — solange nur ein Gerät zur Zeit schreibt.
3. Danach: Realtime auf der Row, Debounce beim `persist`.
4. Konflikt: erst LWW auf dem Dokument, später per Collection.
5. Bilder in Storage. xAI-Key bleibt `localStorage`.
6. RLS: `auth.uid() = user_id`. Nichts öffentlich.

Die App darf bis dahin lokal bleiben. Origin `http://127.0.0.1:4765` ist der heutige Speicherort — ein Deploy auf HTTPS ist ein zweites, leeres Konto, bis Import oder Sync.
