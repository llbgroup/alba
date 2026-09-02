import { formatLong } from './dates'

function timeOf(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function bullets(list) {
  return (list || []).filter(Boolean).map((x) => `- ${x.replace(/^-\s*/, '')}`).join('\n')
}

export function journalToMarkdown(entry, knownAreas = []) {
  const date = entry.date
  const when = timeOf(entry.createdAt)
  const names = Object.fromEntries((knownAreas || []).map((a) => [a.id, a.name]))
  const areas = (entry.areas || []).map((id) => names[id] || id)
  const lines = [
    '---',
    'type: journal',
    'source: alba',
    `date: ${date}`,
    `id: ${entry.id}`,
    areas.length ? `areas: [${areas.join(', ')}]` : 'areas: []',
    '---',
    '',
    `# ${formatLong(date)}${when ? ` · ${when}` : ''}`,
    '',
    entry.title ? `**${entry.title.replace(/\.$/, '')}.**` : '',
    '',
  ]

  if (entry.facts?.length) {
    lines.push('## Was war', bullets(entry.facts), '')
  }
  if (entry.decisions?.length) {
    lines.push('## Entscheidungen', bullets(entry.decisions), '')
  }
  if (entry.questions?.length) {
    lines.push('## Offene Fragen', bullets(entry.questions), '')
  }
  if (entry.energy?.length) {
    lines.push('## Energie', bullets(entry.energy), '')
  }
  if (entry.next?.length) {
    lines.push('## Als nächstes', bullets(entry.next), '')
  }
  if (entry.people?.length) {
    lines.push('## Menschen', bullets(entry.people), '')
  }
  if (entry.transcript) {
    lines.push('## Rohtranskript', '', entry.transcript.trim(), '')
  }
  return lines.filter((x, i, arr) => !(x === '' && arr[i - 1] === '')).join('\n').trim() + '\n'
}

export function haystack(entry) {
  return [
    entry.title,
    entry.transcript,
    ...(entry.facts || []),
    ...(entry.decisions || []),
    ...(entry.questions || []),
    ...(entry.energy || []),
    ...(entry.next || []),
    ...(entry.people || []),
    ...(entry.areas || []),
  ]
    .join(' ')
    .toLowerCase()
}
