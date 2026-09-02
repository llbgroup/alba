import { getXaiKey } from './xaiKey'

export async function rewriteText({ text, action = 'fix', custom = '' }) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 60000)
  try {
    const res = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        action,
        custom,
        key: getXaiKey(),
      }),
      signal: ctrl.signal,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err = new Error(data.error || 'Umschreiben fehlgeschlagen.')
      err.status = res.status
      throw err
    }
    return String(data.text || '').trim()
  } catch (err) {
    if (err?.name === 'AbortError') throw new Error('Dauert zu lange.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}
