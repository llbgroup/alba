import { useEffect, useMemo, useState } from 'react'
import {
  activeHabits,
  canLogHabit,
  habitDays,
  habitDueOn,
  habitEligibleDays,
  habitLog,
  habitMisses,
  habitRate,
  logHabit,
  useAlba,
} from '../store'
import { lastNDays, todayISO } from '../lib/dates'

export default function HabitTrack() {
  const s = useAlba()
  const date = todayISO()
  const habits = activeHabits(s)
  const due = habits.filter((h) => habitDueOn(h, date))
  const days = useMemo(() => lastNDays(date, 7), [date])
  const monthDays = useMemo(() => lastNDays(date, 28), [date])
  const allDaily = due.length > 0 && due.every((h) => habitDays(h).length === 7)
  const [pickId, setPickId] = useState(null)

  useEffect(() => {
    if (!pickId) return
    const close = (e) => {
      if (!e.target.closest?.('.habit-check')) setPickId(null)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [pickId])

  function onCheck(h) {
    const val = habitLog(s, h.id, date)
    if (!h.tiny) {
      logHabit(h.id, date, val ? null : 'full')
      setPickId(null)
      return
    }
    setPickId(pickId === h.id ? null : h.id)
  }

  function choose(h, value) {
    const val = habitLog(s, h.id, date)
    if (value !== val) logHabit(h.id, date, value)
    setPickId(null)
  }

  return (
    <section className="section">
      <div className="section-head">
        <span className="section-label">{allDaily || due.length === 0 ? 'Jeden Tag' : 'Routinen'}</span>
        <span className="quiet">Nie zweimal fehlen</span>
      </div>
      {habits.length === 0 && (
        <p className="empty">
          Unter Routinen einrichten. Hier nur abhaken.
        </p>
      )}
      {habits.length > 0 && due.length === 0 && (
        <p className="empty">Heute keine. Unter Routinen die Tage setzen.</p>
      )}
      {[...due]
        .sort((a, b) => {
          const aHeld = habitLog(s, a.id, date) ? 1 : 0
          const bHeld = habitLog(s, b.id, date) ? 1 : 0
          return aHeld - bHeld
        })
        .map((h) => {
        const val = habitLog(s, h.id, date)
        const misses = habitMisses(s, h.id, date)
        const eligible = habitEligibleDays(h, monthDays)
        const hits = eligible.filter((d) => habitLog(s, h.id, d)).length
        const rate = Math.round(habitRate(s, h.id, monthDays) * 100)
        return (
          <div className={'habit-check' + (val ? ' held' : '')} key={h.id}>
            <button
              className={'check' + (val ? ' on' : '') + (val === 'tiny' ? ' mini' : '')}
              onClick={() => onCheck(h)}
              aria-label={val ? `${h.name} ändern` : `${h.name} halten`}
              aria-expanded={pickId === h.id}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M5 12.5l5 5L19 7" />
              </svg>
            </button>
            <div>
              <strong className="habit-name">{h.name}</strong>
              {h.trigger ? (
                <p className="habit-cue">
                  {h.trigger} → {h.action || h.name}
                </p>
              ) : h.identity ? (
                <p className="habit-cue">{h.identity}</p>
              ) : null}
              {pickId === h.id && (
                <div className="habit-pick">
                  <button
                    type="button"
                    className={'habit-pick-opt' + (val === 'full' ? ' on' : '')}
                    onClick={() => choose(h, 'full')}
                  >
                    <b>Gehalten</b>
                  </button>
                  <button
                    type="button"
                    className={'habit-pick-opt' + (val === 'tiny' ? ' on' : '')}
                    onClick={() => choose(h, 'tiny')}
                  >
                    <b>Mini</b>
                    {h.tiny ? <span className="quiet">{h.tiny}</span> : null}
                  </button>
                  {val && (
                    <button type="button" className="habit-pick-opt" onClick={() => choose(h, null)}>
                      <b>Offen</b>
                    </button>
                  )}
                </div>
              )}
              <div className="pebbles" aria-hidden="true">
                {days.map((d) => {
                  const logged = habitLog(s, h.id, d)
                  const dueDay = habitDueOn(h, d)
                  const open = dueDay && canLogHabit(d, date)
                  return (
                    <button
                      key={d}
                      type="button"
                      className={
                        'pebble' +
                        (logged === 'full' ? ' full' : logged ? ' tiny' : '') +
                        (d === date ? ' today' : '') +
                        (!dueDay ? ' off' : '')
                      }
                      disabled={!open}
                      onClick={() => open && logHabit(h.id, d, logged ? null : 'full')}
                    />
                  )
                })}
              </div>
              <span className="rate">
                {hits} von {eligible.length}
                {eligible.length >= 7 ? ` · ${rate}%` : ''}
                {' · Dichte, kein Streak'}
              </span>
              {misses === 1 && <p className="warn-line">Gestern pausiert. Heute hält die Linie.</p>}
              {misses >= 2 && (
                <p className="warn-line">{h.tiny ? `Mini reicht: ${h.tiny}` : 'Zwei Tage. Kleinste Version.'}</p>
              )}
            </div>
          </div>
        )
      })}
      <button className="btn quiet" onClick={() => { location.hash = '#/habits' }}>
        Routinen einrichten
      </button>
    </section>
  )
}
