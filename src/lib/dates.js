const DOW = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const DOW_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(d = new Date()) {
  return toISO(d)
}

export function addDays(iso, n) {
  const d = parseISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function startOfWeek(iso) {
  const d = parseISO(iso)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return toISO(d)
}

export function endOfWeek(iso) {
  return addDays(startOfWeek(iso), 6)
}

export function isoWeekKey(iso) {
  const start = startOfWeek(iso)
  const thursday = parseISO(addDays(start, 3))
  const year = thursday.getFullYear()
  const jan4 = toISO(new Date(year, 0, 4))
  const w1 = startOfWeek(jan4)
  const week = Math.round((parseISO(start) - parseISO(w1)) / (7 * 86400000)) + 1
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function weekDays(iso) {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthDays(iso) {
  const d = parseISO(iso)
  const start = toISO(new Date(d.getFullYear(), d.getMonth(), 1))
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return Array.from({ length: endDate }, (_, i) => addDays(start, i))
}

export function lastNDays(iso, n) {
  return Array.from({ length: n }, (_, i) => addDays(iso, -(n - 1 - i)))
}

export function monthKeyFromISO(iso) {
  return iso.slice(0, 7)
}

export function formatMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

export function startOfMonth(key) {
  return `${key}-01`
}

export function endOfMonth(key) {
  const [y, m] = key.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${key}-${String(last).padStart(2, '0')}`
}

export function startOfIsoWeek(weekKey) {
  const [y, w] = weekKey.split('-W').map(Number)
  const jan4 = toISO(new Date(y, 0, 4))
  const w1 = startOfWeek(jan4)
  return addDays(w1, (w - 1) * 7)
}

export function formatWeekRange(weekKey) {
  const start = startOfIsoWeek(weekKey)
  const end = addDays(start, 6)
  return `${formatShort(start)} – ${formatShort(end)}`
}

export function upcomingWeekKeys(fromISO, n = 8) {
  const start = startOfWeek(fromISO)
  return Array.from({ length: n }, (_, i) => isoWeekKey(addDays(start, i * 7)))
}

export function addWeeks(iso, n) {
  return addDays(iso, n * 7)
}

export function weekCellLabel(weekKey, today = todayISO()) {
  const cur = isoWeekKey(today)
  if (weekKey === cur) return 'Diese Woche'
  const next = isoWeekKey(addDays(startOfWeek(today), 7))
  if (weekKey === next) return 'Nächste'
  return formatWeekRange(weekKey)
}

export function weekLabel(weekKey, today = todayISO()) {
  if (!weekKey) return ''
  const cur = isoWeekKey(today)
  const next = isoWeekKey(addDays(startOfWeek(today), 7))
  if (weekKey === cur) return 'Diese Woche'
  if (weekKey === next) return 'Nächste Woche'
  const start = startOfIsoWeek(weekKey)
  const n = Math.round((parseISO(start) - parseISO(startOfWeek(today))) / (7 * 86400000))
  if (n === 2) return 'In 2 Wochen'
  if (n === 3) return 'In 3 Wochen'
  if (n === 4) return 'In 4 Wochen'
  if (n === -1) return 'Letzte Woche'
  return formatWeekRange(weekKey)
}

export function previousMonthKey(key) {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function monthKeysInYear(year) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
}

export function monthShortName(key) {
  const m = Number(String(key).split('-')[1])
  return MONTHS_SHORT[m - 1] || ''
}

export function weeksOverlappingMonth(key) {
  const start = startOfWeek(startOfMonth(key))
  const end = endOfMonth(key)
  const weeks = []
  let d = start
  for (let i = 0; i < 8; i++) {
    const wk = isoWeekKey(d)
    const ws = startOfWeek(d)
    const we = addDays(ws, 6)
    if (we >= startOfMonth(key) && ws <= end) weeks.push(wk)
    d = addDays(d, 7)
    if (ws > end) break
  }
  return weeks
}

export function formatLong(iso) {
  const d = parseISO(iso)
  return `${DOW[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

export function formatMedium(iso) {
  const d = parseISO(iso)
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function formatShort(iso) {
  const d = parseISO(iso)
  return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`
}

export function dowName(iso) {
  return DOW[parseISO(iso).getDay()]
}

export function dowShort(iso) {
  return DOW_SHORT[parseISO(iso).getDay()]
}

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export function weekdayISO(iso) {
  const d = parseISO(iso).getDay()
  return d === 0 ? 7 : d
}

export function dayNum(iso) {
  return parseISO(iso).getDate()
}

export function monthName(iso) {
  return MONTHS[parseISO(iso).getMonth()]
}

export function yearOf(iso) {
  return parseISO(iso).getFullYear()
}

export function isSameMonth(a, b) {
  const da = parseISO(a)
  const db = parseISO(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth()
}

export function nextWeekday(fromISO, jsDay) {
  const d = parseISO(fromISO)
  const delta = (jsDay - d.getDay() + 7) % 7
  d.setDate(d.getDate() + delta)
  return toISO(d)
}

export function hourNow() {
  return new Date().getHours()
}

export function isEvening() {
  return hourNow() >= 17
}
