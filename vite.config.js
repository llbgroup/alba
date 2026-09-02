import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))
const journalDir = join(root, 'journal')

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function json(res, code, data) {
  res.statusCode = code
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function albaJournal() {
  async function handle(req, res, next) {
    const url = (req.url || '').split('?')[0]
    if (url !== '/api/journal' || req.method !== 'POST') return next()
    try {
      const body = await readBody(req)
      const date = (body.date || '').slice(0, 10)
      const markdown = (body.markdown || '').trim()
      if (!date || !markdown) {
        json(res, 400, { ok: false, error: 'date and markdown required' })
        return
      }
      mkdirSync(journalDir, { recursive: true })
      const file = join(journalDir, `${date}.md`)
      const block = markdown.trim() + '\n'
      if (existsSync(file)) {
        const prev = readFileSync(file, 'utf8')
        if (!prev.includes(`id: ${body.id}`)) {
          writeFileSync(file, prev.trimEnd() + '\n\n---\n\n' + block)
        } else {
          writeFileSync(file, prev)
        }
      } else {
        writeFileSync(file, block)
      }
      const indexPath = join(journalDir, 'INDEX.md')
      const line = `- [[${date}]] ${body.title || 'Eintrag'}`
      let index = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '# Alba Journal\n\n'
      if (!index.includes(`[[${date}]]`) || (body.title && !index.includes(body.title))) {
        if (!index.includes(line)) index = index.trimEnd() + `\n${line}\n`
        writeFileSync(indexPath, index)
      }
      json(res, 200, { ok: true, file: `journal/${date}.md` })
    } catch (err) {
      json(res, 500, { ok: false, error: String(err.message || err) })
    }
  }
  return {
    name: 'alba-journal',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

const AI_PROMPTS = {
  fix: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Behalte Ton, Inhalt, Sprache (Deutsch) und ungefähr die Länge. Gib nur den korrigierten Text zurück, keine Anführungszeichen, keine Erklärung.',
  clear: 'Mach den Text klarer und direkter, ohne den Sinn zu ändern. Deutsch. Gib nur den Text zurück.',
  expand: 'Formuliere den Text aus, in derselben Stimme. Mehr Substanz, kein Geschwafel. Deutsch. Gib nur den Text zurück.',
  short: 'Kürze auf das Wesentliche. Behalte die Stimme. Deutsch. Gib nur den Text zurück.',
}

function albaRewrite() {
  async function handle(req, res, next) {
    const url = (req.url || '').split('?')[0]
    if (url !== '/api/rewrite' || req.method !== 'POST') return next()
    try {
      const body = await readBody(req)
      const text = (body.text || '').trim()
      if (!text) {
        json(res, 400, { error: 'Kein Text.' })
        return
      }
      const env = loadEnv('development', root, '')
      const key = String(body.key || process.env.XAI_API_KEY || env.XAI_API_KEY || '').trim()
      if (!key) {
        json(res, 501, { error: 'Kein xAI-Schlüssel. Unter Einstellungen eintragen.' })
        return
      }
      const custom = (body.custom || '').trim()
      const canned = AI_PROMPTS[body.action] || AI_PROMPTS.fix
      const system = custom
        ? `Führe diesen Auftrag am Text aus. Deutsch. Gib nur den resultierenden Text zurück, keine Erklärung.\n\nAuftrag: ${custom}`
        : canned
      const r = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'grok-4.6',
          stream: false,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: text },
          ],
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        json(res, r.status, { error: data.error?.message || 'xAI-Fehler' })
        return
      }
      const out = (data.choices?.[0]?.message?.content || '').trim()
      if (!out) {
        json(res, 502, { error: 'Leere Antwort.' })
        return
      }
      json(res, 200, { text: out })
    } catch (err) {
      json(res, 500, { error: String(err.message || err) })
    }
  }
  return {
    name: 'alba-rewrite',
    configureServer(server) {
      server.middlewares.use(handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handle)
    },
  }
}

export default defineConfig({
  plugins: [react(), albaJournal(), albaRewrite()],
  server: {
    host: '127.0.0.1',
    port: 4765,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4765,
  },
})
