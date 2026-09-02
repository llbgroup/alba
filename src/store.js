import { useSyncExternalStore } from 'react'
import { uid } from './lib/ids'
import {
  addDays,
  formatMonthKey,
  formatShort,
  isoWeekKey,
  startOfIsoWeek,
  startOfMonth,
  startOfWeek,
  todayISO,
  weekDays,
  weekLabel,
  weekdayISO,
  WEEKDAY_SHORT,
} from './lib/dates'
import { parseCapture } from './lib/parse'
import { journalToMarkdown } from './lib/journalMd'
import { buildShowcase } from './seed'

const KEY = 'alba.v1'
export const MAX_MITS = 3
export const MAX_HABITS = 5
export const MAX_GOALS = 3
export const YEAR_PREVIEW = 3
export const MAX_YEAR_AIMS = 12
export const MAX_MONTH_AIMS = 3
export const MAX_WEEK_AIMS = 1

function emptyState() {
  return {
    version: 3,
    onboardingComplete: true,
    profile: { name: '', theme: 'dusk', background: 'cloud' },
    areas: [],
    tasks: [],
    goals: [],
    habits: [],
    themes: [],
    weekGoals: [],
    ideas: [],
    aims: [],
    habitLogs: {},
    goalLogs: {},
    days: {},
    journalEntries: [],
    reviews: {},
    focus: null,
    createdAt: null,
    updatedAt: null,
  }
}

const PROJECT_TONES = ['sea', 'terra', 'gold', 'olive', 'rose']

function mergeAreas(existing) {
  if (!Array.isArray(existing) || !existing.length) return []
  return existing.map((a) => ({
    id: a.id,
    name: a.name || 'Projekt',
    note: a.note || a.description || '',
    tone: a.tone || 'sea',
    active: a.active !== false,
    createdAt: a.createdAt || null,
  }))
}

function flattenWeekGoals(s) {
  if ((s.version || 0) >= 3) return s
  const now = new Date().toISOString()
  const today = todayISO()
  const currentWeek = isoWeekKey(today)
  const tasks = [...(s.tasks || [])]
  const ideas = [...(s.ideas || [])]
  const keepGoals = []
  const seenIdea = new Set(ideas.map((i) => `${(i.title || '').trim()}::${(i.body || '').trim()}`))

  function pushIdea(title, body, areaId, createdAt) {
    const t = (title || '').trim() || 'Idee'
    const b = (body || '').trim()
    if (!b) return
    const key = `${t}::${b}`
    if (seenIdea.has(key)) return
    seenIdea.add(key)
    ideas.push({
      id: uid(),
      title: t,
      body: b,
      areaId: areaId || null,
      createdAt: createdAt || now,
      updatedAt: createdAt || now,
    })
  }

  for (const g of s.weekGoals || []) {
    const kids = tasks.filter((t) => t.weekGoalId === g.id && t.status !== 'dropped')
    if (g.status === 'done') {
      keepGoals.push(g)
      continue
    }
    if (!kids.length) {
      let date = null
      let when = 'inbox'
      if (g.weekKey && g.weekKey > currentWeek) {
        date = startOfIsoWeek(g.weekKey)
        when = 'today'
      }
      tasks.push({
        id: uid(),
        title: (g.title || '').trim() || 'Ohne Titel',
        notes: g.note || '',
        ifThen: '',
        areaId: g.areaId || null,
        themeId: g.themeId || null,
        weekGoalId: g.id,
        when,
        date,
        deadline: null,
        rank: 0,
        status: 'open',
        createdAt: g.createdAt || now,
        doneAt: null,
        droppedAt: null,
      })
    } else if ((g.note || '').trim()) {
      pushIdea(g.title, g.note, g.areaId, g.createdAt)
    }
  }

  for (const area of s.areas || []) {
    if (area.active === false) continue
    pushIdea(area.name, area.note, area.id, area.createdAt)
  }

  const normalized = tasks.map((t) => {
    if (t.status === 'dropped') return t
    if (!t.date && (t.when === 'week' || t.when === 'upcoming')) {
      return { ...t, when: 'inbox' }
    }
    return t
  })

  return { ...s, tasks: normalized, ideas, weekGoals: keepGoals, version: 3 }
}

function migrate(s) {
  let next = { ...emptyState(), ...s }
  next.version = s.version || 0
  next.areas = mergeAreas(s.areas)
  next.themes = Array.isArray(s.themes) ? s.themes : []
  next.weekGoals = (Array.isArray(s.weekGoals) ? s.weekGoals : []).map((g) => ({
    ...g,
    note: g.note || '',
  }))
  next.ideas = (Array.isArray(s.ideas) ? s.ideas : []).map((i) => ({
    ...i,
    taskIds: Array.isArray(i.taskIds) ? i.taskIds : [],
  }))
  next.aims = Array.isArray(s.aims) ? s.aims : []
  next.journalEntries = Array.isArray(s.journalEntries) ? s.journalEntries : []
  if (!Array.isArray(next.themes)) next.themes = []
  if (!next.profile?.theme || next.profile.theme === 'ink') {
    next.profile = { ...next.profile, theme: 'dusk' }
  }
  if (!next.profile.background) {
    next.profile = { ...next.profile, background: 'cloud' }
  }
  next = flattenWeekGoals(next)
  next.version = 3
  return next
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const migrated = migrate(JSON.parse(raw))
    localStorage.setItem(KEY, JSON.stringify(migrated))
    return migrated
  } catch {
    return emptyState()
  }
}

function persist(s) {
  const { toast: _toast, ...rest } = s
  try {
    localStorage.setItem(KEY, JSON.stringify(rest))
  } catch {
    toast = { id: uid(), message: 'Speicher voll. Ein kleineres Bild wählen.' }
  }
}

let state = load()
let toast = null
let toastTimer = null
let cached = { ...state, toast }
const listeners = new Set()

function emit() {
  cached = { ...state, toast }
  listeners.forEach((l) => l())
}

function snapshot() {
  return cached
}

function update(fn) {
  const now = new Date().toISOString()
  state = fn(state)
  state = { ...state, updatedAt: now, createdAt: state.createdAt || now }
  persist(state)
  emit()
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getState() {
  return snapshot()
}

export function useAlba() {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function showToast(message) {
  toast = { id: uid(), message }
  emit()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast = null
    emit()
  }, 3400)
}

function nextRank(tasks, date) {
  return tasks
    .filter((t) => t.status === 'open' && t.when === 'today' && t.date === date)
    .reduce((m, t) => Math.max(m, t.rank || 0), 0) + 1
}

function makeTask(partial, date = todayISO()) {
  return {
    id: uid(),
    title: '',
    notes: '',
    ifThen: '',
    areaId: null,
    themeId: null,
    weekGoalId: null,
    weekKey: null,
    ideaId: null,
    when: 'inbox',
    date: null,
    deadline: null,
    rank: 0,
    status: 'open',
    createdAt: new Date().toISOString(),
    doneAt: null,
    droppedAt: null,
    ...partial,
    title: (partial.title || '').trim(),
  }
}

export function setTheme(theme) {
  update((s) => ({ ...s, profile: { ...s.profile, theme } }))
}

export function setName(name) {
  update((s) => ({ ...s, profile: { ...s.profile, name } }))
}

const DEMO_KEY = 'alba.demo.v1'

export function fillDemo(force = false) {
  try {
    if (!force && localStorage.getItem(DEMO_KEY)) return false
  } catch {
    /* ignore */
  }
  const today = todayISO()
  const built = buildShowcase(uid, today)
  update((s) => ({
    ...s,
    onboardingComplete: true,
    areas: built.areas,
    weekGoals: built.weekGoals || [],
    tasks: built.tasks,
    ideas: built.ideas || [],
    aims: built.aims || [],
    habits: built.habits,
    habitLogs: built.habitLogs,
    days: { ...s.days, ...built.days },
  }))
  try {
    localStorage.setItem(DEMO_KEY, '1')
  } catch {
    /* ignore */
  }
  showToast('Beispiel geladen. Erklärt die Flächen — kein echtes Leben.')
  return true
}

const SKY_KEY = 'alba.sky.v1'
let customSky = null
try {
  customSky = localStorage.getItem(SKY_KEY)
} catch {
  customSky = null
}

export function getCustomSky() {
  return customSky
}

export function setBackground(id) {
  update((s) => ({ ...s, profile: { ...s.profile, background: id || 'cloud' } }))
}

export function setCustomBackground(dataUrl) {
  if (!dataUrl) return
  try {
    localStorage.setItem(SKY_KEY, dataUrl)
    customSky = dataUrl
  } catch {
    showToast('Bild zu groß für dieses Gerät. Ein kleineres wählen.')
    return
  }
  update((s) => ({ ...s, profile: { ...s.profile, background: 'custom' } }))
}

function resolveSchedule(partial, today) {
  let when = partial.when || 'inbox'
  let date = partial.date || null
  let weekKey = partial.weekKey || null
  if (when === 'tomorrow') {
    date = addDays(today, 1)
    when = 'today'
    weekKey = isoWeekKey(date)
  } else if (when === 'nextweek' && !date && !weekKey) {
    when = 'week'
    weekKey = isoWeekKey(addDays(startOfWeek(today), 7))
    date = null
  } else if (when === 'week' && !date) {
    weekKey = weekKey || isoWeekKey(today)
    date = null
  } else if (when === 'today') {
    date = date || today
    weekKey = isoWeekKey(date)
  } else if (when === 'upcoming' && date) {
    when = 'today'
    weekKey = isoWeekKey(date)
  } else if (when === 'upcoming' && !date) {
    date = addDays(today, 1)
    when = 'today'
    weekKey = isoWeekKey(date)
  } else if (date) {
    when = 'today'
    weekKey = isoWeekKey(date)
  } else if (weekKey) {
    when = 'week'
    date = null
  } else if (when === 'someday' || when === 'anytime') {
    date = null
    weekKey = null
  } else {
    when = 'inbox'
    date = null
    weekKey = null
  }
  return { when, date, weekKey }
}

function scheduleToast(resolved, today) {
  if (resolved.date === today) {
    const count = state.tasks.filter((t) => t.status === 'open' && t.date === today).length
    if (count > MAX_MITS) showToast('Heute hat drei Plätze. Das Weitere wartet darunter.')
    return
  }
  if (resolved.date && resolved.date > today) {
    showToast(`Liegt für ${formatShort(resolved.date)} bereit.`)
    return
  }
  if (resolved.weekKey) {
    showToast(`Liegt unter ${weekLabel(resolved.weekKey, today)}.`)
    return
  }
  if (!resolved.date) showToast('Liegt unter Neu.')
}

export function capture(raw, defaults = {}) {
  const parsed = parseCapture(raw, state.areas)
  const title = parsed.title
  if (!title) return null
  const today = todayISO()
  let when = parsed.when
  let date = parsed.date
  let weekKey = parsed.weekKey || null
  if (parsed.when === 'inbox' && defaults.when) when = defaults.when
  if (!date && defaults.date) date = defaults.date
  if (!weekKey && defaults.weekKey) weekKey = defaults.weekKey
  if (defaults.forceToday) {
    when = 'today'
    date = today
    weekKey = isoWeekKey(today)
  }
  const resolved = resolveSchedule({ when, date, weekKey }, today)
  const task = makeTask({
    title,
    areaId: parsed.areaId || defaults.areaId || null,
    ...resolved,
    rank: resolved.date === today ? nextRank(state.tasks, resolved.date) : 0,
  })
  update((s) => ({ ...s, tasks: [task, ...s.tasks] }))
  scheduleToast(resolved, today)
  return task
}

export function addTask(partial) {
  const today = todayISO()
  const resolved = resolveSchedule(partial, today)
  const task = makeTask({
    ...partial,
    ...resolved,
    rank: resolved.date === today ? nextRank(state.tasks, resolved.date) : 0,
  })
  if (!task.title) return null
  update((s) => ({ ...s, tasks: [task, ...s.tasks] }))
  return task
}

export function updateTask(id, patch) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }))
}

export function completeTask(id) {
  const parentId = state.tasks.find((t) => t.id === id)?.weekGoalId
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === id ? { ...t, status: 'done', doneAt: new Date().toISOString() } : t,
    ),
    focus: s.focus?.taskId === id ? null : s.focus,
  }))
  if (parentId) rollupWeekGoal(parentId)
}

export function reopenTask(id) {
  const parentId = state.tasks.find((t) => t.id === id)?.weekGoalId
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === id ? { ...t, status: 'open', doneAt: null, droppedAt: null } : t,
    ),
  }))
  if (parentId) rollupWeekGoal(parentId)
}

export function toggleTask(id) {
  const t = state.tasks.find((x) => x.id === id)
  if (!t) return
  if (t.status === 'done') reopenTask(id)
  else completeTask(id)
}

export function dropTask(id) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === id ? { ...t, status: 'dropped', droppedAt: new Date().toISOString() } : t,
    ),
  }))
  showToast('Losgelassen.')
}

export function deleteTask(id) {
  update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
}

export function pullToToday(id) {
  const today = todayISO()
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            when: 'today',
            date: today,
            weekKey: isoWeekKey(today),
            rank: nextRank(s.tasks, today),
            status: 'open',
          }
        : t,
    ),
  }))
  const count = getState().tasks.filter(
    (t) => t.status === 'open' && t.when === 'today' && t.date === today,
  ).length
  if (count > MAX_MITS) showToast('Heute hat drei Plätze. Das Weitere wartet darunter.')
}

export function sendTo(id, destination) {
  if (destination === 'today') return scheduleTask(id, { date: todayISO() })
  if (destination === 'tomorrow') return scheduleTask(id, { date: addDays(todayISO(), 1) })
  if (destination === 'week' || destination === 'thisweek') {
    return scheduleTask(id, { weekKey: isoWeekKey(todayISO()) })
  }
  if (destination === 'nextweek') {
    return scheduleTask(id, { weekKey: isoWeekKey(addDays(startOfWeek(todayISO()), 7)) })
  }
  if (
    destination === 'inbox' ||
    destination === 'anytime' ||
    destination === 'someday' ||
    destination === 'later'
  ) {
    return scheduleTask(id, null)
  }
  return scheduleTask(id, { when: destination })
}

export function resolveStale(id, action) {
  if (action === 'drop') dropTask(id)
  else if (action === 'today') pullToToday(id)
  else sendTo(id, action)
}

export function resolveAllStale(action) {
  const today = todayISO()
  const stale = state.tasks.filter((t) => t.status === 'open' && t.date && t.date < today)
  stale.forEach((t) => resolveStale(t.id, action))
}

export function reorderToday(ids) {
  const today = todayISO()
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      const idx = ids.indexOf(t.id)
      if (idx === -1) return t
      return { ...t, rank: idx + 1, when: 'today', date: today, weekKey: isoWeekKey(today) }
    }),
  }))
}

export function setHighlight(text, date = todayISO()) {
  update((s) => ({
    ...s,
    days: {
      ...s.days,
      [date]: { ...(s.days[date] || defaultDay()), highlight: text },
    },
  }))
}

function defaultDay() {
  return {
    highlight: '',
    closed: false,
    closedAt: null,
    good: ['', '', ''],
    log: '',
    learned: '',
    tomorrow: '',
    transcript: '',
  }
}

export function closeDay(fields, date = todayISO()) {
  const tomorrow = addDays(date, 1)
  update((s) => {
    const nextDay = s.days[tomorrow] || defaultDay()
    const carryHighlight =
      fields.tomorrow?.trim() && !nextDay.highlight ? fields.tomorrow.trim() : nextDay.highlight
    return {
      ...s,
      days: {
        ...s.days,
        [date]: {
          ...(s.days[date] || defaultDay()),
          ...fields,
          closed: true,
          closedAt: new Date().toISOString(),
        },
        [tomorrow]: { ...nextDay, highlight: carryHighlight },
      },
    }
  })
  writeEveningJournal(fields, date)
}

function writeEveningJournal(fields, date) {
  const good = (fields.good || []).map((g) => (g || '').trim()).filter(Boolean)
  const log = (fields.log || '').trim()
  const learned = (fields.learned || '').trim()
  const tomorrow = (fields.tomorrow || '').trim()
  const transcript = (fields.transcript || '').trim()
  if (!transcript && !log && !learned && !good.length && !tomorrow) return
  const highlight = (state.days[date]?.highlight || '').trim()
  const payload = {
    title: learned || good[0] || highlight || 'Abend',
    date,
    transcript,
    facts: log ? [log] : [],
    energy: good,
    next: tomorrow ? [tomorrow] : [],
    source: 'evening',
  }
  const existing = (state.journalEntries || []).find((e) => e.date === date && e.source === 'evening')
  if (existing) updateJournalEntry(existing.id, payload)
  else saveJournalEntry(payload, { silent: true })
}

function archiveJournal(entry) {
  const markdown = journalToMarkdown(entry, state.areas)
  fetch('/api/journal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: entry.date,
      id: entry.id,
      title: entry.title,
      markdown,
    }),
  }).catch(() => {})
}

export function saveJournalEntry(partial, opts = {}) {
  const now = new Date().toISOString()
  const entry = {
    id: uid(),
    transcript: '',
    facts: [],
    decisions: [],
    questions: [],
    energy: [],
    next: [],
    areas: [],
    people: [],
    source: '',
    ...partial,
    title: (partial.title || '').trim(),
    date: partial.date || todayISO(),
    createdAt: partial.createdAt || now,
  }
  if (!entry.title && !entry.transcript?.trim() && !(entry.facts || []).length) return null
  update((s) => ({ ...s, journalEntries: [entry, ...(s.journalEntries || [])] }))
  archiveJournal(entry)
  if (!opts.silent) showToast('Eintrag gehalten.')
  return entry
}

export function updateJournalEntry(id, patch) {
  let next = null
  update((s) => ({
    ...s,
    journalEntries: (s.journalEntries || []).map((e) => {
      if (e.id !== id) return e
      next = { ...e, ...patch }
      return next
    }),
  }))
  if (next) archiveJournal(next)
}

export function deleteJournalEntry(id) {
  update((s) => ({
    ...s,
    journalEntries: (s.journalEntries || []).filter((e) => e.id !== id),
  }))
}

export function journalList(s) {
  return (s.journalEntries || [])
    .slice()
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
}

export function reopenDay(date = todayISO()) {
  update((s) => ({
    ...s,
    days: {
      ...s.days,
      [date]: { ...(s.days[date] || defaultDay()), closed: false, closedAt: null },
    },
  }))
}

export function addHabit(partial) {
  if (state.habits.filter((h) => h.active).length >= MAX_HABITS) {
    showToast('Fünf Routinen reichen. Weniger wird automatischer.')
    return null
  }
  const habit = {
    id: uid(),
    name: '',
    identity: '',
    trigger: '',
    action: '',
    tiny: '',
    areaId: null,
    active: true,
    createdAt: new Date().toISOString(),
    ...partial,
  }
  if (!habit.trigger?.trim()) {
    showToast('Jede Routine braucht einen Anker — danach oder dann.')
    return null
  }
  if (!habit.name.trim()) return null
  update((s) => ({ ...s, habits: [...s.habits, habit] }))
  return habit
}

export function updateHabit(id, patch) {
  update((s) => ({
    ...s,
    habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
  }))
}

export function archiveHabit(id) {
  update((s) => ({
    ...s,
    habits: s.habits.map((h) => (h.id === id ? { ...h, active: false } : h)),
  }))
}

export const ALL_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]

export function habitDays(habit) {
  const days = habit?.days
  if (!Array.isArray(days) || !days.length) return ALL_WEEKDAYS
  return days.filter((d) => d >= 1 && d <= 7)
}

export function habitDueOn(habit, date) {
  return habitDays(habit).includes(weekdayISO(date))
}

export function habitDaysLabel(habit) {
  const days = habitDays(habit)
  if (days.length === 7) return 'Jeden Tag'
  return days.map((d) => WEEKDAY_SHORT[d - 1]).join(' · ')
}

export function toggleHabitDay(id, day) {
  const habit = state.habits.find((h) => h.id === id)
  if (!habit) return
  const current = habitDays(habit)
  const has = current.includes(day)
  let next = has ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)
  if (!next.length) return
  updateHabit(id, { days: next.length === 7 ? null : next })
}

export function canLogHabit(date, today = todayISO()) {
  return date === today || date === addDays(today, -1)
}

export function logHabit(id, date, value) {
  const habit = state.habits.find((h) => h.id === id)
  if (!canLogHabit(date) || (habit && !habitDueOn(habit, date))) return
  const key = `${id}|${date}`
  const prev = state.habitLogs[key] || null
  update((s) => {
    const next = { ...s.habitLogs }
    if (!value || next[key] === value) delete next[key]
    else next[key] = value
    return { ...s, habitLogs: next }
  })
  const now = state.habitLogs[key] || null
  if (now && now !== prev) {
    if (now === 'tiny') showToast(habit?.tiny ? `Mini: ${habit.tiny}` : 'Mini zählt.')
    else showToast(habit?.identity || 'Gehalten.')
  }
}

export function addGoal(partial) {
  const active = state.goals.filter((g) => g.status === 'active').length
  if (active >= MAX_GOALS) {
    showToast('Drei Ziele gleichzeitig. Mehr verdünnt den Willen.')
  }
  const goal = {
    id: uid(),
    title: '',
    wish: '',
    outcome: '',
    obstacle: '',
    plan: '',
    areaId: 'privat',
    status: 'active',
    createdAt: new Date().toISOString(),
    releasedAt: null,
    releaseNote: '',
    ...partial,
  }
  goal.title = (goal.wish || goal.title || '').trim()
  goal.wish = goal.title
  if (!goal.title) return null
  update((s) => ({ ...s, goals: [goal, ...s.goals] }))
  return goal
}

export function updateGoal(id, patch) {
  update((s) => ({
    ...s,
    goals: s.goals.map((g) => {
      if (g.id !== id) return g
      const next = { ...g, ...patch }
      if (patch.wish && !patch.title) next.title = patch.wish
      return next
    }),
  }))
}

export function setGoalStatus(id, status, releaseNote = '') {
  update((s) => ({
    ...s,
    goals: s.goals.map((g) =>
      g.id === id
        ? {
            ...g,
            status,
            releasedAt: status === 'released' || status === 'done' ? new Date().toISOString() : null,
            releaseNote,
          }
        : g,
    ),
  }))
}

export function touchGoal(id, date = todayISO()) {
  const key = `${id}|${date}`
  update((s) => {
    const next = { ...s.goalLogs }
    if (next[key]) delete next[key]
    else next[key] = true
    return { ...s, goalLogs: next }
  })
}

export function saveReview(weekKey, fields) {
  update((s) => ({
    ...s,
    reviews: {
      ...s.reviews,
      [weekKey]: {
        kept: '',
        dropped: '',
        learned: '',
        focus: '',
        done: true,
        savedAt: new Date().toISOString(),
        ...fields,
        done: true,
      },
    },
  }))
}

export function exportState() {
  const { toast: _t, ...rest } = getState()
  const blob = new Blob([JSON.stringify(rest, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `alba-${todayISO()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importState(json, mode = 'replace') {
  const incoming = typeof json === 'string' ? JSON.parse(json) : json
  if (!incoming || typeof incoming !== 'object') throw new Error('Ungültige Datei')
  if (mode === 'replace') {
    state = migrate({ ...emptyState(), ...incoming, onboardingComplete: true })
    persist(state)
    emit()
  } else {
    update((s) => ({
      ...s,
      tasks: [...(incoming.tasks || []), ...s.tasks],
      goals: [...(incoming.goals || []), ...s.goals],
      habits: [...(incoming.habits || []), ...s.habits],
      habitLogs: { ...s.habitLogs, ...(incoming.habitLogs || {}) },
      goalLogs: { ...s.goalLogs, ...(incoming.goalLogs || {}) },
      days: { ...s.days, ...(incoming.days || {}) },
      journalEntries: [...(incoming.journalEntries || []), ...(s.journalEntries || [])],
      reviews: { ...s.reviews, ...(incoming.reviews || {}) },
      themes: [...(incoming.themes || []), ...s.themes],
      weekGoals: [...(incoming.weekGoals || []), ...s.weekGoals],
      ideas: [...(incoming.ideas || []), ...(s.ideas || [])],
      aims: [...(incoming.aims || []), ...(s.aims || [])],
    }))
  }
}

export function resetAll() {
  try {
    localStorage.removeItem(SKY_KEY)
    localStorage.removeItem(DEMO_KEY)
  } catch {
    /* ignore */
  }
  customSky = null
  state = emptyState()
  persist(state)
  emit()
}

export function getDay(s, date) {
  return s.days[date] || defaultDay()
}

export function todayTasks(s, date = todayISO()) {
  const weekStart = startOfWeek(date)
  return s.tasks
    .filter((t) => {
      if (t.status === 'dropped') return false
      if (!t.date) return false
      if (t.date === date) return true
      return t.status === 'open' && t.date >= weekStart && t.date < date
    })
    .sort((a, b) => {
      const ad = a.status === 'done' ? 1 : 0
      const bd = b.status === 'done' ? 1 : 0
      if (ad !== bd) return ad - bd
      if (ad) return (a.doneAt || '').localeCompare(b.doneAt || '')
      return (a.rank || 0) - (b.rank || 0) || a.createdAt.localeCompare(b.createdAt)
    })
}

export function staleTasks(s, date = todayISO()) {
  const weekStart = startOfWeek(date)
  return s.tasks
    .filter((t) => t.status === 'open' && t.date && t.date < weekStart)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function inboxTasks(s) {
  return (s.tasks || []).filter((t) => t.status === 'open' && !t.date && !t.weekKey)
}

export function plannedTasks(s) {
  return (s.tasks || [])
    .filter((t) => t.status === 'open' && (t.date || t.weekKey))
    .sort(sortPlanned)
}

function taskWeekKey(t) {
  if (t.date) return isoWeekKey(t.date)
  return t.weekKey || null
}

function sortPlanned(a, b) {
  if (!a.date && b.date) return -1
  if (a.date && !b.date) return 1
  if (a.date && b.date) {
    const byDate = a.date.localeCompare(b.date)
    if (byDate) return byDate
  }
  return (a.rank || 0) - (b.rank || 0) || (a.createdAt || '').localeCompare(b.createdAt || '')
}

export function plannedTimeline(s, fromISO = todayISO()) {
  const today = fromISO
  const tomorrow = addDays(today, 1)
  const current = isoWeekKey(today)
  const next = isoWeekKey(addDays(startOfWeek(today), 7))
  const items = (s.tasks || []).filter((t) => t.status === 'open' && (t.date || t.weekKey))
  const overdue = items
    .filter(
      (t) =>
        (t.date && t.date < today) || (!t.date && t.weekKey && t.weekKey < current),
    )
    .sort(sortPlanned)
  const rest = items.filter((t) => !overdue.includes(t))

  const buckets = []
  if (overdue.length) {
    buckets.push({
      key: 'overdue',
      label: 'Überfällig',
      kind: 'overdue',
      always: false,
      spec: { date: today },
      tasks: overdue,
    })
  }

  function take(pred) {
    return rest.filter(pred).sort(sortPlanned)
  }

  buckets.push({
    key: 'today',
    label: 'Heute',
    kind: 'today',
    always: true,
    spec: { date: today },
    tasks: take((t) => t.date === today),
  })
  buckets.push({
    key: 'tomorrow',
    label: 'Morgen',
    kind: 'tomorrow',
    always: true,
    spec: { date: tomorrow },
    tasks: take((t) => t.date === tomorrow),
  })
  buckets.push({
    key: `week:${current}`,
    label: 'Diese Woche',
    kind: 'week',
    always: true,
    weekKey: current,
    spec: { weekKey: current },
    tasks: take((t) => t.date !== today && t.date !== tomorrow && taskWeekKey(t) === current),
  })
  buckets.push({
    key: `week:${next}`,
    label: 'Nächste Woche',
    kind: 'week',
    always: true,
    weekKey: next,
    spec: { weekKey: next },
    tasks: take((t) => t.date !== today && t.date !== tomorrow && taskWeekKey(t) === next),
  })

  const laterWeeks = [
    ...new Set(rest.map(taskWeekKey).filter((k) => k && k > next)),
  ].sort()
  for (const wk of laterWeeks) {
    const start = startOfIsoWeek(wk)
    const n = Math.round((new Date(start + 'T12:00:00') - new Date(startOfWeek(today) + 'T12:00:00')) / (7 * 86400000))
    if (n > 4) continue
    buckets.push({
      key: `week:${wk}`,
      label: weekLabel(wk, today),
      kind: 'week',
      always: false,
      weekKey: wk,
      spec: { weekKey: wk },
      tasks: take((t) => taskWeekKey(t) === wk),
    })
  }

  const assigned = new Set()
  for (const b of buckets) {
    for (const t of b.tasks) assigned.add(t.id)
  }
  const leftover = rest.filter(
    (t) => !assigned.has(t.id) && t.date !== today && t.date !== tomorrow,
  )
  const months = new Map()
  for (const t of leftover) {
    const mk = t.date ? t.date.slice(0, 7) : startOfIsoWeek(t.weekKey).slice(0, 7)
    if (!months.has(mk)) months.set(mk, [])
    months.get(mk).push(t)
  }
  for (const [mk, tasks] of [...months.entries()].sort()) {
    const first = startOfMonth(mk)
    buckets.push({
      key: `month:${mk}`,
      label: formatMonthKey(mk),
      kind: 'month',
      always: false,
      monthKey: mk,
      spec: { date: first > today ? first : addDays(today, 1) },
      tasks: tasks.sort(sortPlanned),
    })
  }

  return buckets
}

export function scheduleTask(id, spec) {
  const t = state.tasks.find((x) => x.id === id)
  if (!t) return
  const today = todayISO()
  if (spec == null || spec === '') {
    updateTask(id, { date: null, weekKey: null, when: 'inbox' })
    return
  }
  const resolved =
    typeof spec === 'string' ? resolveSchedule({ date: spec }, today) : resolveSchedule(spec, today)
  updateTask(id, {
    ...resolved,
    rank: resolved.date === today ? nextRank(state.tasks, resolved.date) : t.rank || 0,
    status: t.status === 'dropped' ? 'open' : t.status,
  })
}

export function setTaskTag(id, areaId) {
  updateTask(id, { areaId: areaId || null })
}

export function activeTags(s) {
  return (s.areas || []).filter((a) => a.active !== false)
}

export function laterTasks(s, when) {
  return s.tasks
    .filter((t) => t.status === 'open' && t.when === when)
    .sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date)
      if (a.date) return -1
      if (b.date) return 1
      return b.createdAt.localeCompare(a.createdAt)
    })
}

export function upcomingGrouped(s) {
  const items = laterTasks(s, 'upcoming')
  const groups = []
  const map = new Map()
  for (const t of items) {
    const key = t.date || 'undatiert'
    if (!map.has(key)) {
      const g = { date: t.date, tasks: [] }
      map.set(key, g)
      groups.push(g)
    }
    map.get(key).tasks.push(t)
  }
  return groups
}

export function doneOn(s, date) {
  return s.tasks
    .filter((t) => t.status === 'done' && t.doneAt && t.doneAt.slice(0, 10) === date)
    .sort((a, b) => a.doneAt.localeCompare(b.doneAt))
}

export function habitLog(s, id, date) {
  return s.habitLogs[`${id}|${date}`] || null
}

export function habitMisses(s, id, date) {
  const habit = s.habits.find((h) => h.id === id)
  if (!habit) return 0
  if (habitLog(s, id, date)) return 0
  const created = (habit.createdAt || '').slice(0, 10)
  const prev = []
  let cursor = addDays(date, -1)
  for (let i = 0; i < 28 && prev.length < 2; i++) {
    if (habitDueOn(habit, cursor) && (!created || cursor >= created)) prev.push(cursor)
    cursor = addDays(cursor, -1)
  }
  if (!prev.length) return 0
  const missed = prev.filter((d) => !habitLog(s, id, d)).length
  if (missed === 2 && prev.length === 2) return 2
  if (!habitLog(s, id, prev[0])) return 1
  return 0
}

export function habitEligibleDays(habit, days) {
  const created = (habit?.createdAt || '').slice(0, 10)
  return days.filter((d) => habitDueOn(habit, d) && (!created || d >= created))
}

export function habitRate(s, id, days) {
  const habit = s.habits.find((h) => h.id === id)
  if (!habit) return 0
  const eligible = habitEligibleDays(habit, days)
  if (!eligible.length) return 0
  const hits = eligible.filter((d) => habitLog(s, id, d)).length
  return hits / eligible.length
}

export function activeHabits(s) {
  return s.habits.filter((h) => h.active)
}

export function activeGoals(s) {
  return s.goals.filter((g) => g.status === 'active')
}

export function goalTouched(s, id, date) {
  return Boolean(s.goalLogs[`${id}|${date}`])
}

export function areaById(s, id) {
  return (s.areas || []).find((a) => a.id === id) || null
}

export function addProject(name) {
  const title = (name || '').trim()
  if (!title) return null
  const live = (state.areas || []).filter((a) => a.active !== false)
  const project = {
    id: uid(),
    name: title,
    note: '',
    tone: PROJECT_TONES[live.length % PROJECT_TONES.length],
    active: true,
    createdAt: new Date().toISOString(),
  }
  update((s) => ({ ...s, areas: [...(s.areas || []), project] }))
  return project
}

export function updateProject(id, patch) {
  update((s) => ({
    ...s,
    areas: (s.areas || []).map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }))
}

export function archiveProject(id) {
  update((s) => ({
    ...s,
    areas: (s.areas || []).map((a) => (a.id === id ? { ...a, active: false } : a)),
  }))
}

export function addTheme(partial) {
  const theme = {
    id: uid(),
    horizon: false,
    monthKey: null,
    areaId: null,
    title: '',
    status: 'open',
    createdAt: new Date().toISOString(),
    ...partial,
    title: (partial.title || '').trim(),
  }
  if (!theme.title) return null
  update((s) => ({ ...s, themes: [...s.themes, theme] }))
  return theme
}

export function updateTheme(id, patch) {
  update((s) => ({
    ...s,
    themes: s.themes.map((t) => (t.id === id ? { ...t, ...patch } : t)),
  }))
}

export function setThemeStatus(id, status) {
  updateTheme(id, { status })
}

export function addWeekGoal(partial) {
  const goal = {
    id: uid(),
    weekKey: '',
    themeId: null,
    areaId: null,
    title: '',
    note: '',
    status: 'open',
    rank: 0,
    createdAt: new Date().toISOString(),
    ...partial,
    title: (partial.title || '').trim(),
    weekKey: partial.weekKey || '',
    note: partial.note || '',
  }
  if (!goal.title) return null
  update((s) => ({ ...s, weekGoals: [...s.weekGoals, goal] }))
  return goal
}

export function addProjectTodo(areaId, title) {
  return addWeekGoal({ areaId, title, weekKey: '' })
}

export function updateWeekGoal(id, patch) {
  update((s) => ({
    ...s,
    weekGoals: s.weekGoals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  }))
}

export function setWeekGoalStatus(id, status) {
  updateWeekGoal(id, {
    status,
    doneAt: status === 'done' ? new Date().toISOString() : null,
  })
}

export function toggleWeekGoal(id) {
  const g = state.weekGoals.find((x) => x.id === id)
  if (!g) return
  const openKids = weekTodos(state, id).filter((t) => t.status === 'open')
  if (g.status !== 'done' && openKids.length) {
    showToast('Erst die Schritte auf der Karte.')
    return
  }
  setWeekGoalStatus(id, g.status === 'done' ? 'open' : 'done')
}

export function dropWeekGoal(id) {
  const now = new Date().toISOString()
  update((s) => ({
    ...s,
    weekGoals: s.weekGoals.filter((g) => g.id !== id),
    tasks: s.tasks.map((t) =>
      t.weekGoalId === id ? { ...t, status: 'dropped', droppedAt: now } : t,
    ),
  }))
}

export function weekTodos(s, weekGoalId) {
  return (s.tasks || [])
    .filter((t) => t.weekGoalId === weekGoalId && t.status !== 'dropped')
    .sort((a, b) => (a.rank || 0) - (b.rank || 0) || a.createdAt.localeCompare(b.createdAt))
}

export function childProgress(s, weekGoalId) {
  const kids = weekTodos(s, weekGoalId)
  return { total: kids.length, done: kids.filter((t) => t.status === 'done').length }
}

function rollupWeekGoal(id) {
  const kids = weekTodos(state, id)
  if (!kids.length) return
  const parent = state.weekGoals.find((g) => g.id === id)
  if (!parent) return
  const allDone = kids.every((t) => t.status === 'done')
  if (allDone && parent.status !== 'done') {
    setWeekGoalStatus(id, 'done')
    showToast('Alles in dieser Woche gehalten.')
  } else if (!allDone && parent.status === 'done') {
    setWeekGoalStatus(id, 'open')
  }
}

export function setItemWeek(id, weekKey) {
  const key = weekKey || ''
  const days = key ? new Set(weekDays(startOfIsoWeek(key))) : new Set()
  update((s) => ({
    ...s,
    weekGoals: s.weekGoals.map((g) =>
      g.id === id ? { ...g, weekKey: key, status: key ? 'open' : g.status } : g,
    ),
    tasks: key
      ? s.tasks.map((t) => {
          if (t.weekGoalId !== id || !t.date) return t
          if (days.has(t.date)) return t
          return { ...t, date: null, when: 'week' }
        })
      : s.tasks,
  }))
}

export function addWeekTodo(weekGoalId, title, date = null) {
  const g = state.weekGoals.find((x) => x.id === weekGoalId)
  const label = (title || '').trim()
  if (!g || !label) return null
  return addTask({
    title: label,
    when: date ? 'today' : 'week',
    date: date || null,
    weekGoalId: g.id,
    themeId: g.themeId,
    areaId: g.areaId,
  })
}

export function scheduleWeekTodo(id, date) {
  const t = state.tasks.find((x) => x.id === id)
  if (!t) return
  if (!date) {
    updateTask(id, { date: null, when: 'week' })
    return
  }
  updateTask(id, { date, when: 'today', status: t.status === 'dropped' ? 'open' : t.status })
}

export function projectStacks(s) {
  const items = s.weekGoals || []
  return (s.areas || [])
    .filter((area) => area.active !== false)
    .map((area) => ({
      area,
      items: items
        .filter((g) => g.areaId === area.id)
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === 'open' ? -1 : 1
          return (a.createdAt || '').localeCompare(b.createdAt || '')
        }),
    }))
}

export function placeThemeOnWeek(themeId, weekKey, title) {
  const theme = state.themes.find((t) => t.id === themeId)
  if (!theme) return null
  const label = (title || '').trim()
  if (!label) {
    showToast('Wochenfokus braucht einen Satz.')
    return null
  }
  return addWeekGoal({
    weekKey,
    themeId: theme.id,
    areaId: theme.areaId,
    title: label,
  })
}

export function addDaily(title, weekGoalId = null, date = todayISO()) {
  const g = weekGoalId ? state.weekGoals.find((x) => x.id === weekGoalId) : null
  return addTask({
    title,
    when: 'today',
    date,
    weekGoalId: g?.id || null,
    themeId: g?.themeId || null,
    areaId: g?.areaId || null,
  })
}

function makeIdea(partial = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: '',
    body: '',
    areaId: null,
    taskIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
    title: (partial.title || '').trim(),
    body: partial.body || '',
    taskIds: Array.isArray(partial.taskIds) ? partial.taskIds : [],
  }
}

export function addIdea(partial = {}) {
  const idea = makeIdea(partial)
  update((s) => ({ ...s, ideas: [idea, ...(s.ideas || [])] }))
  return idea
}

export function updateIdea(id, patch, opts = {}) {
  const now = new Date().toISOString()
  const touch = opts.touch !== false
  update((s) => ({
    ...s,
    ideas: (s.ideas || []).map((i) =>
      i.id === id ? { ...i, ...patch, ...(touch ? { updatedAt: now } : {}) } : i,
    ),
  }))
}

export function deleteIdea(id) {
  update((s) => ({
    ...s,
    ideas: (s.ideas || []).filter((i) => i.id !== id),
    tasks: (s.tasks || []).map((t) => (t.ideaId === id ? { ...t, ideaId: null } : t)),
  }))
}

export function ideaTasks(s, ideaId) {
  const idea = (s.ideas || []).find((i) => i.id === ideaId)
  const ids = idea?.taskIds || []
  const byId = new Map((s.tasks || []).map((t) => [t.id, t]))
  const ordered = ids.map((id) => byId.get(id)).filter(Boolean)
  const extra = (s.tasks || []).filter(
    (t) => t.ideaId === ideaId && t.status !== 'dropped' && !ids.includes(t.id),
  )
  return [...ordered, ...extra].filter((t) => t.status !== 'dropped')
}

export function linkTaskToIdea(taskId, ideaId) {
  const idea = (state.ideas || []).find((i) => i.id === ideaId)
  if (!idea) return
  const prev = (state.tasks || []).find((t) => t.id === taskId)?.ideaId || null
  const now = new Date().toISOString()
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId ? { ...t, ideaId, areaId: t.areaId || idea.areaId || null } : t,
    ),
    ideas: (s.ideas || []).map((i) => {
      if (i.id === ideaId) {
        const taskIds = i.taskIds || []
        if (taskIds.includes(taskId)) return i
        return { ...i, taskIds: [...taskIds, taskId], updatedAt: now }
      }
      if (prev && i.id === prev) {
        return { ...i, taskIds: (i.taskIds || []).filter((id) => id !== taskId) }
      }
      return i
    }),
  }))
}

export function unlinkTaskFromIdea(taskId, ideaId) {
  update((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId && t.ideaId === ideaId ? { ...t, ideaId: null } : t,
    ),
    ideas: (s.ideas || []).map((i) =>
      i.id === ideaId ? { ...i, taskIds: (i.taskIds || []).filter((id) => id !== taskId) } : i,
    ),
  }))
}

export function addIdeaTask(ideaId, title, spec = {}) {
  const idea = (state.ideas || []).find((i) => i.id === ideaId)
  if (!idea) return null
  const task = addTask({
    title,
    ideaId,
    areaId: idea.areaId || null,
    ...spec,
  })
  if (!task) return null
  const now = new Date().toISOString()
  update((s) => ({
    ...s,
    ideas: (s.ideas || []).map((i) =>
      i.id === ideaId ? { ...i, taskIds: [...(i.taskIds || []), task.id], updatedAt: now } : i,
    ),
  }))
  return task
}

export function syncIdeaTasksFromHtml(ideaId, html) {
  const unique = [...new Set(taskIdsFromHtml(html))]
  const idea = (state.ideas || []).find((i) => i.id === ideaId)
  if (!idea) return
  const prev = idea.taskIds || []
  const same = prev.length === unique.length && prev.every((id, i) => id === unique[i])
  if (same) return
  const removed = prev.filter((id) => !unique.includes(id))
  update((s) => ({
    ...s,
    ideas: (s.ideas || []).map((i) => (i.id === ideaId ? { ...i, taskIds: unique } : i)),
    tasks: s.tasks.map((t) =>
      removed.includes(t.id) && t.ideaId === ideaId ? { ...t, ideaId: null } : t,
    ),
  }))
}

function taskIdsFromHtml(html) {
  return [...String(html || '').matchAll(/data-task-id="([^"]+)"/g)].map((m) => m[1]).filter(Boolean)
}

export function searchOpenTasks(s, q, exclude = []) {
  const needle = (q || '').trim().toLowerCase()
  const skip = new Set(exclude)
  return (s.tasks || [])
    .filter((t) => t.status === 'open' && !skip.has(t.id))
    .filter((t) => !needle || (t.title || '').toLowerCase().includes(needle))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 10)
}

export function openIdea(id) {
  try {
    localStorage.setItem('alba.idea.v1', id)
  } catch {
    /* ignore */
  }
  location.hash = '#/ideas'
}

export function ideaList(s) {
  return [...(s.ideas || [])].sort((a, b) =>
    (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''),
  )
}

export function ideaById(s, id) {
  return (s.ideas || []).find((i) => i.id === id) || null
}

function makeAim(partial = {}) {
  const now = new Date().toISOString()
  return {
    id: uid(),
    title: '',
    note: '',
    horizon: 'month',
    year: null,
    monthKey: null,
    weekKey: null,
    areaId: null,
    status: 'open',
    createdAt: now,
    updatedAt: now,
    ...partial,
    title: (partial.title || '').trim(),
    note: partial.note || '',
  }
}

function aimSlot(a) {
  if (a.horizon === 'year') return `year:${a.year}`
  if (a.horizon === 'week') return `week:${a.weekKey}`
  return `month:${a.monthKey}`
}

function aimCap(horizon) {
  if (horizon === 'year') return MAX_YEAR_AIMS
  if (horizon === 'week') return MAX_WEEK_AIMS
  return MAX_MONTH_AIMS
}

export function addAim(partial = {}) {
  const horizon = partial.horizon || 'month'
  const live = (state.aims || []).filter(
    (a) => a.status === 'open' && aimSlot(a) === aimSlot({ ...partial, horizon }),
  )
  if (live.length >= aimCap(horizon)) {
    showToast(
      horizon === 'week'
        ? 'Eine Woche, ein Satz.'
        : horizon === 'year'
          ? 'Zwölf Richtungen reichen fürs Jahr.'
          : 'Drei Sätze reichen für den Monat.',
    )
    return null
  }
  const aim = makeAim({ ...partial, horizon })
  update((s) => ({ ...s, aims: [...(s.aims || []), aim] }))
  return aim
}

export function updateAim(id, patch) {
  const now = new Date().toISOString()
  update((s) => ({
    ...s,
    aims: (s.aims || []).map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now } : a)),
  }))
}

export function dropAim(id) {
  const now = new Date().toISOString()
  update((s) => ({
    ...s,
    aims: (s.aims || []).map((a) => (a.id === id ? { ...a, status: 'dropped', updatedAt: now } : a)),
  }))
}

export function carryAim(id, monthKey) {
  const src = (state.aims || []).find((a) => a.id === id)
  if (!src) return null
  return addAim({
    title: src.title,
    note: src.note || '',
    horizon: 'month',
    monthKey,
    areaId: src.areaId,
  })
}

export function openAims(s, match = {}) {
  return (s.aims || []).filter((a) => {
    if (a.status !== 'open') return false
    if (match.horizon && a.horizon !== match.horizon) return false
    if (match.year != null && a.year !== match.year) return false
    if (match.monthKey && a.monthKey !== match.monthKey) return false
    if (match.weekKey && a.weekKey !== match.weekKey) return false
    return true
  })
}

export function weekAim(s, weekKey) {
  return (
    (s.aims || []).find(
      (a) => a.status === 'open' && a.horizon === 'week' && a.weekKey === weekKey && a.title.trim(),
    ) || null
  )
}

export function moveWeekGoal(id, weekKey) {
  if (weekKey === 'done') {
    const openKids = weekTodos(state, id).filter((t) => t.status === 'open')
    if (openKids.length) {
      showToast('Erst die Schritte auf der Karte.')
      return
    }
    setWeekGoalStatus(id, 'done')
    return
  }
  setItemWeek(id, weekKey)
}

export function weekBoard(s, fromISO = todayISO()) {
  const cur = isoWeekKey(fromISO)
  const next = isoWeekKey(addDays(startOfWeek(fromISO), 7))
  const open = (s.weekGoals || []).filter((g) => g.status === 'open' && g.weekKey)
  return {
    thisWeek: open.filter((g) => g.weekKey === cur),
    nextWeek: open.filter((g) => g.weekKey === next),
    later: open.filter((g) => g.weekKey > next),
    done: (s.weekGoals || [])
      .filter((g) => g.status === 'done' && g.weekKey)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 12),
  }
}

export function weekGoalById(s, id) {
  return (s.weekGoals || []).find((g) => g.id === id) || null
}

export function archiveLog(s) {
  const goals = (s.weekGoals || [])
    .filter((g) => g.status === 'done')
    .sort((a, b) => {
      const wk = (b.weekKey || '').localeCompare(a.weekKey || '')
      if (wk) return wk
      return (b.doneAt || b.createdAt || '').localeCompare(a.doneAt || a.createdAt || '')
    })
  const groups = []
  const map = new Map()
  for (const g of goals) {
    const key = g.weekKey || 'ohne'
    if (!map.has(key)) {
      const block = { weekKey: key, goals: [] }
      map.set(key, block)
      groups.push(block)
    }
    map.get(key).goals.push(g)
  }
  return { groups, count: goals.length }
}

export function memoryLog(s) {
  const items = []
  for (const e of s.journalEntries || []) {
    items.push({
      kind: 'entry',
      id: e.id,
      date: e.date,
      at: e.createdAt || e.date,
      title: e.title || 'Eintrag',
      source: e.source || '',
      hay: [e.title, e.transcript, ...(e.facts || []), ...(e.decisions || []), ...(e.next || []), ...(e.energy || [])].join(' '),
    })
  }
  for (const g of s.weekGoals || []) {
    if (g.status !== 'done') continue
    items.push({
      kind: 'week',
      id: g.id,
      date: (g.doneAt || g.createdAt || '').slice(0, 10) || (g.weekKey ? startOfIsoWeek(g.weekKey) : ''),
      at: g.doneAt || g.createdAt || '',
      title: g.title,
      weekKey: g.weekKey,
      hay: [g.title, g.note].join(' '),
    })
  }
  for (const t of s.tasks || []) {
    if (t.status !== 'done') continue
    items.push({
      kind: 'task',
      id: t.id,
      date: (t.doneAt || t.date || t.createdAt || '').slice(0, 10),
      at: t.doneAt || t.createdAt || '',
      title: t.title,
      hay: [t.title, t.notes].join(' '),
    })
  }
  for (const a of s.areas || []) {
    if (a.active !== false) continue
    items.push({
      kind: 'project',
      id: a.id,
      date: (a.createdAt || '').slice(0, 10),
      at: a.createdAt || '',
      title: a.name,
      hay: [a.name, a.note].join(' '),
    })
  }
  items.sort((a, b) => (b.at || '').localeCompare(a.at || ''))
  return items
}

function ensureLogDay(map, date) {
  if (!date || date.length < 10) return null
  const key = date.slice(0, 10)
  if (!map.has(key)) {
    map.set(key, {
      date: key,
      highlight: '',
      closed: false,
      learned: '',
      log: '',
      good: [],
      tomorrow: '',
      transcript: '',
      entries: [],
      done: [],
      created: [],
      ideas: [],
      habits: [],
      weeks: [],
    })
  }
  return map.get(key)
}

function logDayLive(g) {
  return Boolean(
    g.highlight ||
      g.closed ||
      g.learned ||
      g.log ||
      g.tomorrow ||
      g.transcript ||
      g.good.length ||
      g.entries.length ||
      g.done.length ||
      g.created.length ||
      g.ideas.length ||
      g.habits.length ||
      g.weeks.length,
  )
}

export function logDays(s) {
  const map = new Map()
  for (const [date, day] of Object.entries(s.days || {})) {
    const g = ensureLogDay(map, date)
    if (!g || !day) continue
    g.highlight = (day.highlight || '').trim()
    g.closed = !!day.closed
    g.learned = (day.learned || '').trim()
    g.log = (day.log || '').trim()
    g.good = (day.good || []).map((x) => (x || '').trim()).filter(Boolean)
    g.tomorrow = (day.tomorrow || '').trim()
    g.transcript = (day.transcript || '').trim()
  }
  for (const e of s.journalEntries || []) {
    const g = ensureLogDay(map, e.date)
    if (g) g.entries.push(e)
  }
  for (const t of s.tasks || []) {
    if (t.status === 'dropped') continue
    const created = (t.createdAt || '').slice(0, 10)
    const doneOn = t.status === 'done' && t.doneAt ? t.doneAt.slice(0, 10) : ''
    if (doneOn) ensureLogDay(map, doneOn)?.done.push(t)
    if (created && created !== doneOn) ensureLogDay(map, created)?.created.push(t)
  }
  for (const idea of s.ideas || []) {
    const g = ensureLogDay(map, idea.createdAt)
    if (g) g.ideas.push(idea)
  }
  const habits = s.habits || []
  for (const [key, value] of Object.entries(s.habitLogs || {})) {
    if (!value) continue
    const idx = key.lastIndexOf('|')
    if (idx < 0) continue
    const id = key.slice(0, idx)
    const g = ensureLogDay(map, key.slice(idx + 1))
    if (!g) continue
    const habit = habits.find((h) => h.id === id)
    g.habits.push({
      id,
      name: habit?.name || 'Routine',
      value,
      tiny: habit?.tiny || '',
    })
  }
  for (const goal of s.weekGoals || []) {
    if (goal.status !== 'done') continue
    const g = ensureLogDay(map, goal.doneAt || goal.createdAt || (goal.weekKey ? startOfIsoWeek(goal.weekKey) : ''))
    if (g) g.weeks.push(goal)
  }
  return [...map.values()]
    .filter(logDayLive)
    .map((g) => ({
      ...g,
      hay: [
        g.highlight,
        g.learned,
        g.log,
        g.tomorrow,
        ...g.good,
        ...g.entries.map((e) => [e.title, e.transcript, ...(e.facts || []), ...(e.energy || [])].join(' ')),
        ...g.done.map((t) => t.title),
        ...g.created.map((t) => t.title),
        ...g.ideas.map((i) => i.title),
        ...g.habits.map((h) => h.name),
        ...g.weeks.map((w) => w.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function logDay(s, date) {
  if (!date) return null
  return logDays(s).find((d) => d.date === date) || null
}

export function dayBoard(s, fromISO = todayISO()) {
  const today = fromISO
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const dated = (s.tasks || []).filter((t) => t.status !== 'dropped' && t.date)
  const openDated = dated.filter((t) => t.status === 'open')
  const todayItems = openDated
    .filter((t) => t.date <= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || (a.rank || 0) - (b.rank || 0) || a.createdAt.localeCompare(b.createdAt),
    )
  const later = openDated
    .filter((t) => t.date > today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.rank || 0) - (b.rank || 0))
  const upcomingGroups = []
  const map = new Map()
  for (const t of later) {
    if (!map.has(t.date)) {
      const g = { date: t.date, thisWeek: t.date <= weekEnd, tasks: [] }
      map.set(t.date, g)
      upcomingGroups.push(g)
    }
    map.get(t.date).tasks.push(t)
  }
  const doneDays = dated
    .filter((t) => t.status === 'done')
    .filter((t) => {
      const stamp = (t.doneAt || '').slice(0, 10) || t.date
      return stamp >= weekStart && stamp <= weekEnd
    })
    .sort((a, b) => (b.doneAt || b.date || '').localeCompare(a.doneAt || a.date || ''))
  return {
    today: todayItems,
    upcomingGroups,
    upcomingCount: later.length,
    doneDays,
  }
}

export function moveToLane(id, lane) {
  if (lane === 'done') {
    completeTask(id)
    showToast('Erledigt.')
    return
  }
  if (lane === 'today') {
    pullToToday(id)
    return
  }
  if (lane === 'week') {
    sendTo(id, 'week')
    return
  }
  sendTo(id, 'anytime')
}

export function startFocus(taskId, minutes = 25) {
  update((s) => ({
    ...s,
    focus: {
      taskId,
      durationMin: minutes,
      endsAt: Date.now() + minutes * 60 * 1000,
      running: true,
    },
  }))
}

export function pauseFocus() {
  update((s) => {
    if (!s.focus?.running) return s
    const left = Math.max(0, s.focus.endsAt - Date.now())
    return {
      ...s,
      focus: { ...s.focus, running: false, remainingMs: left, endsAt: null },
    }
  })
}

export function resumeFocus() {
  update((s) => {
    if (!s.focus || s.focus.running) return s
    const ms = s.focus.remainingMs || s.focus.durationMin * 60 * 1000
    return {
      ...s,
      focus: { ...s.focus, running: true, endsAt: Date.now() + ms, remainingMs: null },
    }
  })
}

export function clearFocus() {
  update((s) => ({ ...s, focus: null }))
}

export function boardTasks(s) {
  const today = todayISO()
  const open = (s.tasks || []).filter((t) => t.status === 'open')
  const later = open.filter((t) => ['inbox', 'anytime', 'someday', 'upcoming'].includes(t.when) && t.when !== 'week')
  const week = open.filter((t) => t.when === 'week')
  const todayList = open.filter((t) => t.when === 'today' && t.date === today)
  const done = (s.tasks || [])
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''))
    .slice(0, 20)
  return { later, week, today: todayList, done }
}

export function weekGoalToToday(weekGoalId) {
  const g = state.weekGoals.find((x) => x.id === weekGoalId)
  if (!g) return null
  return addTask({
    title: g.title,
    areaId: g.areaId,
    themeId: g.themeId,
    weekGoalId: g.id,
    when: 'today',
  })
}

export function horizonThemes(s) {
  return (s.themes || []).filter((t) => t.horizon)
}

export function monthThemes(s, monthKey) {
  return (s.themes || []).filter((t) => !t.horizon && t.monthKey === monthKey)
}

export function weekGoalsFor(s, weekKey) {
  return (s.weekGoals || [])
    .filter((g) => g.weekKey === weekKey)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0) || a.createdAt.localeCompare(b.createdAt))
}

export function weekGoalsByTheme(s, themeId) {
  return (s.weekGoals || [])
    .filter((g) => g.themeId === themeId)
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey) || a.createdAt.localeCompare(b.createdAt))
}

export function applyVoiceClose(structured, date) {
  const tomorrow = addDays(date, 1)
  closeDay(
    {
      good: structured.good,
      log: structured.log,
      learned: structured.learned,
      tomorrow: structured.tomorrow,
      transcript: structured.transcript,
    },
    date,
  )
  for (const t of structured.tasks || []) {
    if (!t.title?.trim()) continue
    addTask({
      title: t.title.trim(),
      areaId: t.areaId,
      when: 'today',
      date: tomorrow,
    })
  }
  if (structured.tomorrow?.trim()) {
    showToast('Morgen liegt bereit.')
  }
}
