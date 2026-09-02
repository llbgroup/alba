const TOMORROW_RE =
  /\b(morgen|nächste[rn]? tag|nächste woche|als nächstes|vorhaben|plane ich|will ich morgen|soll morgen|tomorrow|heute noch|muss ich|sollte ich)\b/i
const FEEL_RE =
  /\b(fühl|merke|denk|glaub|nervt|freu|stress|müde|unsicher|klar|stolz|dankbar|zweifel|energ|überfordert|ruhig|motiviert|zerstreut)\w*/i
const DONE_RE =
  /\b(habe |hatten wir|gemacht|erledigt|fertig|geschafft|produziert|geschnitten|geschrieben|getroffen|eingerichtet|aufgenommen)\b/i
const DECISION_RE =
  /\b(entscheid|beschloss|ab jetzt|nicht mehr|stattdessen|ich werde|wir behalten|ist raus|festgelegt|commit|wähle|streiche)\w*/i
const QUESTION_RE = /\?|\b(ich frage mich|weiß nicht|bin unsicher|ob ich|soll ich wirklich)\b/i
const FILLER_RE = /\b(äh+m?|ähm|halt|quasi|irgendwie|sozusagen|naja|genau+|also)\b/gi

function guessArea(text, areas = []) {
  const hay = (text || '').toLowerCase()
  for (const a of areas) {
    const name = (a.name || '').trim()
    if (name.length < 2) continue
    if (hay.includes(name.toLowerCase())) return a.id
  }
  return null
}

function guessAreas(text, areas = []) {
  const hay = (text || '').toLowerCase()
  return (areas || [])
    .filter((a) => {
      const name = (a.name || '').trim()
      return name.length >= 2 && hay.includes(name.toLowerCase())
    })
    .map((a) => a.id)
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|(?<=\n+)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

function toTaskTitle(sentence) {
  return sentence
    .replace(/^(und |dann |also |so |ich )+/i, '')
    .replace(/\b(morgen|nächste[rn]? tag)\b/gi, '')
    .replace(/\b(will ich|werde ich|plane ich|soll ich|möchte ich|hab ich vor|habe ich vor)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[,.\s]+|[,.\s]+$/g, '')
    .trim()
}

export function structureEvening(text, areas = []) {
  const raw = (text || '').trim()
  const sentences = splitSentences(raw)
  const tomorrow = []
  const log = []
  const journal = []

  for (const s of sentences) {
    if (TOMORROW_RE.test(s)) tomorrow.push(s)
    else if (FEEL_RE.test(s) && !DONE_RE.test(s)) journal.push(s)
    else log.push(s)
  }

  const good = [...log, ...journal]
    .filter((s) => /\b(gut|geschafft|geklappt|stolz|freu|schön|dankbar|fertig)\b/i.test(s))
    .slice(0, 3)

  while (good.length < 3) good.push('')

  const tasks = tomorrow
    .map((s) => {
      const title = toTaskTitle(s)
      if (!title || title.length < 3) return null
      return { title, areaId: guessArea(s, areas) }
    })
    .filter(Boolean)
    .slice(0, 6)

  return {
    transcript: raw,
    log: log.join(' ').trim(),
    learned: journal[0] || '',
    good,
    tomorrow: toTaskTitle(tomorrow[0] || '') || tomorrow[0] || '',
    tasks,
  }
}

export function guessAreaFromText(text, areas = []) {
  return guessArea(text, areas)
}

export function cleanSpeech(text) {
  return (text || '')
    .replace(FILLER_RE, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim()
}

function unique(list) {
  const seen = new Set()
  const out = []
  for (const x of list) {
    const k = (x || '').trim()
    if (!k || seen.has(k.toLowerCase())) continue
    seen.add(k.toLowerCase())
    out.push(k)
  }
  return out
}

function guessPeople(text) {
  const names = []
  const re = /\bmit ([A-ZÄÖÜ][a-zäöüß]{2,})(?:\s([A-ZÄÖÜ][a-zäöüß]{2,}))?/g
  let m
  while ((m = re.exec(text))) {
    names.push([m[1], m[2]].filter(Boolean).join(' '))
  }
  return unique(names)
}

function polishSentence(s) {
  let t = cleanSpeech(s)
  if (!t) return ''
  t = t.replace(/^(und |dann |also |so )+/i, '')
  t = t.charAt(0).toUpperCase() + t.slice(1)
  if (!/[.!?]$/.test(t)) t += '.'
  return t
}

export function structureJournal(text, areas = []) {
  const raw = (text || '').trim()
  const cleaned = cleanSpeech(raw)
  const sentences = splitSentences(cleaned).map(polishSentence).filter(Boolean)
  const facts = []
  const decisions = []
  const questions = []
  const energy = []
  const next = []

  for (const s of sentences) {
    if (DECISION_RE.test(s)) decisions.push(s)
    else if (QUESTION_RE.test(s)) questions.push(s)
    else if (TOMORROW_RE.test(s)) next.push(s)
    else if (FEEL_RE.test(s) && !DONE_RE.test(s)) energy.push(s)
    else facts.push(s)
  }

  const title = (facts[0] || energy[0] || decisions[0] || sentences[0] || 'Eintrag')
    .replace(/[.!?]+$/, '')
    .slice(0, 88)

  const tasks = next
    .map((s) => {
      const title = toTaskTitle(s)
      if (!title || title.length < 3) return null
      return { title, areaId: guessArea(s, areas) }
    })
    .filter(Boolean)
    .slice(0, 8)

  return {
    transcript: raw,
    title,
    facts: unique(facts),
    decisions: unique(decisions),
    questions: unique(questions),
    energy: unique(energy),
    next: unique(next),
    areas: guessAreas(cleaned, areas),
    people: guessPeople(raw),
    tasks,
    log: facts.join(' '),
    learned: energy[0] || decisions[0] || '',
    tomorrow: toTaskTitle(next[0] || '') || next[0] || '',
    good: [...facts, ...energy]
      .filter((s) => /\b(gut|geschafft|geklappt|stolz|freu|schön|dankbar|fertig)\b/i.test(s))
      .concat(['', '', ''])
      .slice(0, 3),
  }
}
