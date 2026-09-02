import { useState } from 'react'
import {
  activeHabits,
  addWeekGoal,
  areaById,
  doneOn,
  dropWeekGoal,
  getDay,
  habitLog,
  logHabit,
  monthThemes,
  placeThemeOnWeek,
  saveReview,
  setWeekGoalStatus,
  useAlba,
  weekGoalToToday,
  weekGoalsFor,
} from '../store'
import {
  addDays,
  dowShort,
  endOfWeek,
  formatMonthKey,
  formatShort,
  isoWeekKey,
  monthKeyFromISO,
  startOfWeek,
  todayISO,
  weekDays,
} from '../lib/dates'

export default function Week() {
  const s = useAlba()
  const today = todayISO()
  const [anchor, setAnchor] = useState(startOfWeek(today))
  const days = weekDays(anchor)
  const key = isoWeekKey(anchor)
  const monthKey = monthKeyFromISO(anchor)
  const review = s.reviews[key] || { kept: '', dropped: '', learned: '', focus: '', done: false }
  const [form, setForm] = useState(review)
  const [draft, setDraft] = useState('')
  const habits = activeHabits(s)
  const closed = days.filter((d) => getDay(s, d).closed).length
  const completed = days.flatMap((d) => doneOn(s, d))
  const goals = weekGoalsFor(s, key)
  const month = monthThemes(s, monthKey).filter(
    (t) => t.status !== 'done' && !goals.some((g) => g.themeId === t.id),
  )
  const isCurrent = startOfWeek(today) === anchor

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">{formatMonthKey(monthKey)}</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Woche
        </h1>
        <p className="month">
          {formatShort(days[0])} – {formatShort(endOfWeek(anchor))}
        </p>
      </div>
      <div className="row-btns">
        <button className="chip" onClick={() => setAnchor(addDays(anchor, -7))}>
          Vorher
        </button>
        {!isCurrent && (
          <button className="chip" onClick={() => setAnchor(startOfWeek(today))}>
            Diese Woche
          </button>
        )}
        <button className="chip" onClick={() => setAnchor(addDays(anchor, 7))}>
          Nachher
        </button>
      </div>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Wochenziele</span>
          <span className="quiet">
            {goals.filter((g) => g.status === 'done').length}/{goals.length || 0}
          </span>
        </div>
        {goals.length === 0 && (
          <p className="empty">Noch keine. Zieh aus dem Monat, oder schreib eines.</p>
        )}
        {goals.map((g) => {
          const area = areaById(s, g.areaId)
          return (
            <div className={'week-goal' + (g.status === 'done' ? ' done' : '')} key={g.id}>
              <button
                className={'check' + (g.status === 'done' ? ' on' : '')}
                onClick={() => setWeekGoalStatus(g.id, g.status === 'done' ? 'open' : 'done')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12.5l5 5L19 7" />
                </svg>
              </button>
              <div>
                <p style={{ margin: 0, fontWeight: 550 }}>{g.title}</p>
                {area && (
                  <span className={'pip ' + area.tone}>
                    <i />
                    {area.name}
                  </span>
                )}
              </div>
              <div className="task-actions" style={{ opacity: 1 }}>
                <button className="chip" onClick={() => weekGoalToToday(g.id)}>
                  Heute
                </button>
                <button className="chip warn" onClick={() => dropWeekGoal(g.id)}>
                  Weg
                </button>
              </div>
            </div>
          )
        })}
        <form
          className="inline-add"
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            addWeekGoal({ weekKey: key, title: draft.trim() })
            setDraft('')
          }}
        >
          <span className="plus">+</span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Wochenziel hinzufügen"
          />
        </form>
      </section>

      {month.length > 0 && (
        <section className="section">
          <span className="section-label">Aus {formatMonthKey(monthKey)}</span>
          <p className="quiet">Themen, die noch nicht auf dieser Woche liegen.</p>
          {month.map((t) => {
            const area = areaById(s, t.areaId)
            return (
              <div className="theme-row" key={t.id}>
                <div>
                  <p>{t.title}</p>
                  {area && (
                    <span className={'pip ' + area.tone}>
                      <i />
                      {area.name}
                    </span>
                  )}
                </div>
                <button className="chip" onClick={() => placeThemeOnWeek(t.id, key)}>
                  Auf die Woche
                </button>
              </div>
            )
          })}
        </section>
      )}

      <p className="quiet" style={{ marginTop: 18 }}>
        {closed} Tage geschlossen · {completed.length} Dinge erledigt
      </p>

      <section className="section">
        <span className="section-label">Routinen</span>
        <table className="week-table">
          <thead>
            <tr>
              <th></th>
              {days.map((d) => (
                <th key={d}>
                  {dowShort(d)}
                  <div>{d.slice(8)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id}>
                <td>{h.name}</td>
                {days.map((d) => {
                  const val = habitLog(s, h.id, d)
                  const locked = d < addDays(today, -1)
                  return (
                    <td key={d}>
                      <button
                        className={
                          'pebble' +
                          (val === 'full' ? ' full' : val === 'tiny' ? ' tiny' : '') +
                          (d === today ? ' today' : '')
                        }
                        disabled={locked}
                        onClick={() => logHabit(h.id, d, val === 'full' ? null : 'full')}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <article className="review-card">
        <span className="section-label">Wochenrückblick</span>
        <p className="lead" style={{ marginTop: 10 }}>
          Was bleibt, was fällt, was als Nächstes.
        </p>
        <div className="field">
          <label>Was hat sich bewegt?</label>
          <textarea value={form.kept} onChange={(e) => setForm({ ...form, kept: e.target.value })} />
        </div>
        <div className="field">
          <label>Was fällt weg?</label>
          <textarea
            value={form.dropped}
            onChange={(e) => setForm({ ...form, dropped: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Fokus nächste Woche</label>
          <input value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} />
        </div>
        <button className="btn" onClick={() => saveReview(key, form)}>
          {review.done ? 'Aktualisieren' : 'Woche schließen'}
        </button>
      </article>
    </div>
  )
}
