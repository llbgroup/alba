import { addDays, isoWeekKey, nextWeekday, startOfWeek, todayISO } from './dates'

const WEEKDAYS = {
  sonntag: 0, so: 0,
  montag: 1, mo: 1,
  dienstag: 2, di: 2,
  mittwoch: 3, mi: 3,
  donnerstag: 4, do: 4,
  freitag: 5, fr: 5,
  samstag: 6, sa: 6,
}

function strip(text, re) {
  return text.replace(re, ' ').replace(/\s+/g, ' ').trim()
}

export function parseCapture(raw, areas = [], now = new Date()) {
  let text = (raw || '').trim()
  let areaId = null
  let when = 'inbox'
  let date = null
  let weekKey = null
  const today = todayISO(now)

  function escapeRe(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  for (const area of areas) {
    const needles = [area.id, area.name, area.name?.replace(/\s+/g, '')].filter(Boolean)
    for (const needle of [...new Set(needles)]) {
      const re = new RegExp(`#${escapeRe(needle)}\\b`, 'i')
      if (re.test(text)) {
        areaId = area.id
        text = strip(text, re)
        break
      }
    }
  }

  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/)
  if (iso) {
    date = iso[1]
    when = date === today ? 'today' : 'upcoming'
    text = strip(text, iso[0])
  } else if (/\bübermorgen\b/i.test(text)) {
    date = addDays(today, 2)
    when = 'today'
    text = strip(text, /\bübermorgen\b/gi)
  } else if (/\bmorgen\b/i.test(text)) {
    date = addDays(today, 1)
    when = 'tomorrow'
    text = strip(text, /\bmorgen\b/gi)
  } else if (/\bheute\b/i.test(text)) {
    date = today
    when = 'today'
    text = strip(text, /\bheute\b/gi)
  } else if (/\bdiese woche\b/i.test(text)) {
    weekKey = isoWeekKey(today)
    when = 'week'
    date = null
    text = strip(text, /\bdiese woche\b/gi)
  } else if (/\bnächste woche\b/i.test(text)) {
    weekKey = isoWeekKey(addDays(startOfWeek(today), 7))
    when = 'week'
    date = null
    text = strip(text, /\bnächste woche\b/gi)
  } else if (/\birgendwann\b/i.test(text) || /\bsomeday\b/i.test(text)) {
    when = 'someday'
    date = null
    text = strip(text, /\b(irgendwann( mal)?|someday)\b/gi)
  } else if (/\bspäter\b/i.test(text) || /\banytime\b/i.test(text)) {
    when = 'anytime'
    date = null
    text = strip(text, /\b(später|anytime)\b/gi)
  } else {
    for (const [name, jsDay] of Object.entries(WEEKDAYS)) {
      const re = new RegExp(`\\b${name}\\b`, 'i')
      if (re.test(text)) {
        date = nextWeekday(today, jsDay)
        when = date === today ? 'today' : 'upcoming'
        text = strip(text, re)
        break
      }
    }
  }

  return {
    title: text.replace(/\s+/g, ' ').trim(),
    areaId,
    when,
    date,
    weekKey,
  }
}
