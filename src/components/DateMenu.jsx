import {
  addDays,
  dowName,
  dowShort,
  formatShort,
  formatWeekRange,
  isoWeekKey,
  startOfWeek,
  todayISO,
  weekDays,
  weekLabel,
} from '../lib/dates'

export function CalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M3.5 10h17" />
    </svg>
  )
}

export function pinLabel(task, today) {
  if (task.date === today) return 'Heute'
  if (task.date === addDays(today, 1)) return 'Morgen'
  if (task.date) return dowShort(task.date)
  if (!task.weekKey) return null
  const cur = isoWeekKey(today)
  const next = isoWeekKey(addDays(startOfWeek(today), 7))
  if (task.weekKey === cur) return 'Woche'
  if (task.weekKey === next) return 'Nächste'
  return 'Woche'
}

export default function DateMenu({ date, weekKey, onPick }) {
  const today = todayISO()
  const tomorrow = addDays(today, 1)
  const current = isoWeekKey(today)
  const next = isoWeekKey(addDays(startOfWeek(today), 7))
  const thisDays = weekDays(today).filter((d) => d > tomorrow)
  const nextDays = weekDays(addDays(startOfWeek(today), 7))
  const later = [2, 3, 4].map((i) => isoWeekKey(addDays(startOfWeek(today), i * 7)))
  const isWeek = (k) => !date && weekKey === k
  const isDay = (d) => date === d

  return (
    <div className="cal-menu">
      <button type="button" className={isDay(today) ? 'active' : ''} onClick={() => onPick({ date: today })}>
        <span>Heute</span>
        <span className="quiet">{formatShort(today)}</span>
      </button>
      <button
        type="button"
        className={isDay(tomorrow) ? 'active' : ''}
        onClick={() => onPick({ date: tomorrow })}
      >
        <span>Morgen</span>
        <span className="quiet">{formatShort(tomorrow)}</span>
      </button>
      <button
        type="button"
        className={isWeek(current) ? 'active' : ''}
        onClick={() => onPick({ weekKey: current })}
      >
        <span>Diese Woche</span>
        <span className="quiet">{formatWeekRange(current)}</span>
      </button>
      <button type="button" className={isWeek(next) ? 'active' : ''} onClick={() => onPick({ weekKey: next })}>
        <span>Nächste Woche</span>
        <span className="quiet">{formatWeekRange(next)}</span>
      </button>
      {thisDays.length > 0 && <p className="cal-menu-label">Tage diese Woche</p>}
      {thisDays.map((d) => (
        <button key={d} type="button" className={isDay(d) ? 'active' : ''} onClick={() => onPick({ date: d })}>
          <span>{dowName(d)}</span>
          <span className="quiet">{formatShort(d)}</span>
        </button>
      ))}
      <p className="cal-menu-label">Tage nächste Woche</p>
      {nextDays.map((d) => (
        <button key={d} type="button" className={isDay(d) ? 'active' : ''} onClick={() => onPick({ date: d })}>
          <span>{dowName(d)}</span>
          <span className="quiet">{formatShort(d)}</span>
        </button>
      ))}
      <p className="cal-menu-label">Später</p>
      {later.map((wk) => (
        <button
          key={wk}
          type="button"
          className={isWeek(wk) ? 'active' : ''}
          onClick={() => onPick({ weekKey: wk })}
        >
          <span>{weekLabel(wk, today)}</span>
          <span className="quiet">{formatWeekRange(wk)}</span>
        </button>
      ))}
      {(date || weekKey) && (
        <button type="button" className="warn" onClick={() => onPick(null)}>
          Ohne Datum
        </button>
      )}
    </div>
  )
}
