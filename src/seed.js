import { addDays, isoWeekKey } from './lib/dates'

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

export function buildShowcase(uid, today) {
  const now = new Date().toISOString()
  const week = isoWeekKey(today)
  const year = Number(today.slice(0, 4))

  const arbeit = { id: uid(), name: 'Arbeit', note: '', tone: 'sea', active: true, createdAt: now }
  const zuhause = { id: uid(), name: 'Zuhause', note: '', tone: 'olive', active: true, createdAt: now }

  const ids = { today: 'alba.sample.t1', inbox: 'alba.sample.t2' }

  const idea = {
    id: SAMPLE_IDEA_ID,
    title: 'Was eine Idee kann',
    body: `
<p>Eine Idee ist ein Dokument. To-dos sitzen im Text und unter <strong>To-do</strong>. Die Kette ist ein Weblink.</p>
<div class="note-todo" data-task-id="${ids.today}"></div>
<div class="note-todo" data-task-id="${ids.inbox}"></div>
<p><mark class="note-mark">Marker</mark> über einen Satz. Diesen Text darfst du löschen.</p>
`.trim(),
    areaId: arbeit.id,
    taskIds: [ids.today, ids.inbox],
    createdAt: now,
    updatedAt: now,
  }

  const tasks = [
    task(() => ids.today, now, 'Auf Heute — abhaken, bleibt durchgestrichen unten', {
      id: ids.today,
      areaId: arbeit.id,
      ideaId: idea.id,
      when: 'today',
      date: today,
      rank: 1,
    }),
    task(() => ids.inbox, now, 'Ohne Datum — liegt unter Neu', {
      id: ids.inbox,
      areaId: arbeit.id,
      ideaId: idea.id,
      when: 'inbox',
    }),
    task(uid, now, 'Morgen — in der Timeline unter Geplant', {
      areaId: zuhause.id,
      when: 'today',
      date: addDays(today, 1),
    }),
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
    createdAt: addDays(today, -4) + 'T08:00:00.000Z',
  }

  return {
    areas: [arbeit, zuhause],
    weekGoals: [],
    ideas: [idea],
    aims: [
      {
        id: uid(),
        title: 'Ein Satz für das Jahr — Richtung, kein Ordner',
        horizon: 'year',
        year,
        monthKey: null,
        weekKey: null,
        areaId: arbeit.id,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid(),
        title: 'Diese Woche ein Satz — steht auf Heute',
        horizon: 'week',
        year: null,
        monthKey: null,
        weekKey: week,
        areaId: arbeit.id,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks,
    habits: [h1],
    habitLogs: {
      [`${h1.id}|${addDays(today, -1)}`]: 'full',
      [`${h1.id}|${addDays(today, -2)}`]: 'tiny',
    },
    days: {
      [today]: {
        highlight: 'Heute zählt ist ein Satz für den Tag.',
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
