import { getXaiKey } from './xaiKey'

const PROMPTS = {
  fix: 'Korrigiere Rechtschreibung, Grammatik und Zeichensetzung. Behalte Ton, Inhalt, Sprache (Deutsch) und ungefähr die Länge. Gib nur den korrigierten Text zurück, keine Anführungszeichen, keine Erklärung.',
  clear: 'Mach den Text klarer und direkter, ohne den Sinn zu ändern. Deutsch. Gib nur den Text zurück.',
  expand: 'Formuliere den Text aus, in derselben Stimme. Mehr Substanz, kein Geschwafel. Deutsch. Gib nur den Text zurück.',
  short: 'Kürze auf das Wesentliche. Behalte die Stimme. Deutsch. Gib nur den Text zurück.',
}

async function rewriteDirect({ text, action, custom, key, signal }) {
  if (!key) {
    const err = new Error('Kein xAI-Schlüssel. Unter Einstellungen eintragen.')
    err.status = 501
    throw err
  }
  const system = custom
    ? `Führe diesen Auftrag am Text aus. Deutsch. Gib nur den resultierenden Text zurück, keine Erklärung.\n\nAuftrag: ${custom}`
    : PROMPTS[action] || PROMPTS.fix
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
    signal,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error(data.error?.message || 'xAI-Fehler')
  }
  const out = (data.choices?.[0]?.message?.content || '').trim()
  if (!out) throw new Error('Leere Antwort.')
  return out
}

export async function rewriteText({ text, action = 'fix', custom = '' }) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 60000)
  const key = getXaiKey()
  try {
    const res = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, action, custom, key }),
      signal: ctrl.signal,
    })
    if (res.status === 404 || res.status === 405) {
      return rewriteDirect({ text, action, custom, key, signal: ctrl.signal })
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.error || 'Umschreiben fehlgeschlagen.')
      err.status = res.status
      throw err
    }
    return String(data.text || '').trim()
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('Dauert zu lange.')
    if (err?.status) throw err
    try {
      return await rewriteDirect({ text, action, custom, key, signal: ctrl.signal })
    } catch (direct) {
      if (direct?.name === 'AbortError') throw new Error('Dauert zu lange.')
      throw err.message ? err : direct
    }
  } finally {
    clearTimeout(timer)
  }
}
