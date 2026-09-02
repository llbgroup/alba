import { addDays, isoWeekKey, startOfIsoWeek, weekDays } from './lib/dates'

export const HABIT_PRESETS = [
  {
    name: 'Training',
    identity: 'Ich bin jemand, der sich bewegt.',
    trigger: 'Nach dem Aufstehen',
    action: 'Training',
    tiny: 'Schuhe an, zwei Minuten bewegen',
  },
  {
    name: 'Schlaf',
    identity: 'Ich schütze meinen Schlaf.',
    trigger: 'Um 22:30',
    action: 'Bildschirm weg',
    tiny: 'Licht dimmen',
  },
  {
    name: 'Klarheit',
    identity: 'Ich führe den Tag, bevor er mich führt.',
    trigger: 'Mit dem ersten Kaffee',
    action: 'Highlight setzen',
    tiny: 'Einen Satz schreiben',
  },
]

export const SAMPLE_IDEA_ID = 'alba.sample.long'

function task(uid, now, title, extra = {}) {
  return {
    id: extra.id || uid(),
    title,
    notes: extra.notes || '',
    ifThen: '',
    areaId: extra.areaId || null,
    themeId: null,
    weekGoalId: extra.weekGoalId || null,
    weekKey: extra.weekKey || null,
    ideaId: extra.ideaId || null,
    when: extra.when || 'inbox',
    date: extra.date || null,
    deadline: extra.deadline || null,
    rank: extra.rank || 0,
    status: extra.status || 'open',
    createdAt: now,
    doneAt: extra.status === 'done' ? now : null,
    droppedAt: null,
  }
}

export function buildLongSample(today, areaId) {
  const now = new Date().toISOString()
  const week = isoWeekKey(today)
  const ids = {
    inbox: 'alba.sample.t1',
    today: 'alba.sample.t2',
    week: 'alba.sample.t3',
    done: 'alba.sample.t4',
  }
  const ideaId = SAMPLE_IDEA_ID
  const tasks = [
    task(() => ids.today, now, 'Diesen Satz auf Heute datieren', {
      id: ids.today,
      areaId,
      ideaId,
      when: 'today',
      date: today,
      rank: 8,
    }),
    task(() => ids.week, now, 'Diese Aufgabe liegt in der Timeline unter Geplant', {
      id: ids.week,
      areaId,
      ideaId,
      when: 'today',
      date: addDays(today, 3),
    }),
    task(() => ids.inbox, now, 'Ohne Datum liegt sie unter Neu', {
      id: ids.inbox,
      areaId,
      ideaId,
      when: 'inbox',
    }),
    task(() => ids.done, now, 'Abgehakt — auf Heute durchgestrichen unten', {
      id: ids.done,
      areaId,
      ideaId,
      when: 'today',
      date: today,
      status: 'done',
    }),
  ]
  const body = `
<p>Eine Idee ist ein Dokument, kein Zettel. Überschriften, Listen, Marker, Links und To-dos sitzen im selben Text. Die To-dos erscheinen hier und unter <strong>To-do</strong>.</p>
<h2>To-dos im Text</h2>
<p>Das Feld in der Leiste sucht zuerst offene Aufgaben, sonst legt es eine neue an. Kette ist ein Weblink, kein To-do.</p>
<div class="note-todo" data-task-id="${ids.today}"></div>
<div class="note-todo" data-task-id="${ids.week}"></div>
<div class="note-todo" data-task-id="${ids.inbox}"></div>
<div class="note-todo" data-task-id="${ids.done}"></div>
<h2>Markieren und verlinken</h2>
<p><mark class="note-mark">Marker bleibt leise über dem Satz</mark> — volle Höhe, wenig Deckung. Ein <a class="note-link" href="https://developer.mozilla.org/de/docs/Web/Progressive_web_apps" target="_blank" rel="noopener">Weblink</a> öffnet sich per ⌘-Klick.</p>
<h3>Diktat und Umschreiben</h3>
<ul>
<li>Mikrofon schreibt live in den Text</li>
<li>AI braucht den xAI-Schlüssel unter Einstellungen</li>
<li>Tag klebt oben, wie die Formatzeile</li>
</ul>
<p>Die Woche ${week} ist nur Orientierung. Diesen Text darfst du löschen, sobald du weißt, wie sich eine Idee anfühlt.</p>
`.trim()
  return {
    idea: {
      id: ideaId,
      title: 'Was eine Idee kann',
      body,
      areaId: areaId || null,
      taskIds: [ids.today, ids.week, ids.inbox, ids.done],
      createdAt: now,
      updatedAt: now,
    },
    tasks,
  }
}

export function buildShowcase(uid, today) {
  const now = new Date().toISOString()
  const week = isoWeekKey(today)
  const nextWeek = isoWeekKey(addDays(startOfIsoWeek(week), 7))
  const year = Number(today.slice(0, 4))
  const monthKey = today.slice(0, 7)
  const days = weekDays(startOfIsoWeek(week))
  const wed = days[2] || addDays(today, 1)
  const later = addDays(today, 10)

  const arbeit = { id: uid(), name: 'Arbeit', note: '', tone: 'sea', active: true, createdAt: now }
  const zuhause = { id: uid(), name: 'Zuhause', note: '', tone: 'olive', active: true, createdAt: now }
  const lernen = { id: uid(), name: 'Lernen', note: '', tone: 'gold', active: true, createdAt: now }

  const long = buildLongSample(today, lernen.id)

  const tasks = [
    task(uid, now, 'Highlight oben auf Heute setzen — ein Satz, der den Tag hält', {
      areaId: arbeit.id,
      when: 'today',
      date: today,
      rank: 1,
    }),
    task(uid, now, 'Eine Aufgabe abhaken. Sie rutscht nach unten, durchgestrichen', {
      areaId: arbeit.id,
      when: 'today',
      date: today,
      rank: 2,
      status: 'done',
    }),
    task(uid, now, 'Morgen: erscheint in der Timeline unter Geplant', {
      areaId: zuhause.id,
      when: 'today',
      date: addDays(today, 1),
      rank: 3,
    }),
    task(uid, now, 'Mitte der Woche — dieselbe Timeline, nur später', {
      areaId: arbeit.id,
      when: 'today',
      date: wed,
    }),
    task(uid, now, 'Nächste Woche reicht ein Datum, kein eigener Stapel', {
      areaId: lernen.id,
      when: 'today',
      date: addDays(startOfIsoWeek(nextWeek), 1),
    }),
    task(uid, now, 'Später: zehn Tage voraus, immer noch Geplant', {
      areaId: zuhause.id,
      when: 'today',
      date: later,
    }),
    task(uid, now, 'Ohne Datum — das ist Neu, der Eingang', {
      areaId: null,
      when: 'inbox',
    }),
    task(uid, now, 'Tag filtert, ordnet aber nichts. Arbeit ist nur Farbe', {
      areaId: arbeit.id,
      when: 'inbox',
    }),
    ...long.tasks,
  ]

  function aim(title, extra) {
    return {
      id: uid(),
      title,
      horizon: extra.horizon,
      year: extra.year || null,
      monthKey: extra.monthKey || null,
      weekKey: extra.weekKey || null,
      areaId: extra.areaId || null,
      status: 'open',
      createdAt: now,
      updatedAt: now,
    }
  }

  const nextMonthDate = new Date(year, Number(monthKey.slice(5)), 1)
  const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`

  const aims = [
    aim('Ein Satz für das Jahr — Richtung, kein Projektordner', { horizon: 'year', year, areaId: arbeit.id }),
    aim('Zuhause bleibt ruhig genug, dass der Rest Platz hat', { horizon: 'year', year, areaId: zuhause.id }),
    aim('Was dieser Monat halten soll, in einem Satz', { horizon: 'month', monthKey, areaId: arbeit.id }),
    aim('Nächster Monat: derselbe Ort, nur weiter vorne', { horizon: 'month', monthKey: nextMonth, areaId: lernen.id }),
    aim('Diese Woche ein Satz — er steht auf Heute', { horizon: 'week', weekKey: week, areaId: arbeit.id }),
  ]

  const ideas = [
    long.idea,
    {
      id: uid(),
      title: 'Kurz reicht auch',
      body: '<p>Nicht jede Idee braucht To-dos. Ein Absatz, ein Tag, fertig.</p>',
      areaId: zuhause.id,
      taskIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ]

  const h1 = {
    id: uid(),
    name: 'Training',
    identity: 'Ich bin jemand, der sich bewegt.',
    trigger: 'Nach dem Aufstehen',
    action: 'Training',
    tiny: 'Schuhe an, zwei Minuten bewegen',
    days: null,
    areaId: null,
    active: true,
    createdAt: addDays(today, -10) + 'T08:00:00.000Z',
  }
  const h2 = {
    id: uid(),
    name: 'Klarheit',
    identity: 'Ich führe den Tag, bevor er mich führt.',
    trigger: 'Mit dem ersten Kaffee',
    action: 'Highlight setzen',
    tiny: 'Einen Satz schreiben',
    days: [1, 2, 3, 4, 5],
    areaId: null,
    active: true,
    createdAt: addDays(today, -10) + 'T08:00:00.000Z',
  }
  const habitLogs = {}
  for (let i = 1; i <= 6; i++) {
    const d = addDays(today, -i)
    habitLogs[`${h1.id}|${d}`] = i === 2 ? 'tiny' : 'full'
    const weekday = new Date(`${d}T12:00:00`).getDay()
    const iso = weekday === 0 ? 7 : weekday
    if (iso <= 5 && i !== 3) habitLogs[`${h2.id}|${d}`] = 'full'
  }

  return {
    areas: [arbeit, zuhause, lernen],
    weekGoals: [],
    ideas,
    aims,
    tasks,
    habits: [h1, h2],
    habitLogs,
    days: {
      [today]: {
        highlight: 'Heute zählt ist ein Satz für den Tag — kein Ziel, keine Liste.',
        closed: false,
        closedAt: null,
        good: ['', '', ''],
        log: '',
        learned: '',
        tomorrow: '',
        transcript: '',
      },
    },
  }
}
