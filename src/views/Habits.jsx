import { useState } from 'react'
import {
  MAX_HABITS,
  activeHabits,
  addHabit,
  archiveHabit,
  canLogHabit,
  habitDays,
  habitDaysLabel,
  habitDueOn,
  habitEligibleDays,
  habitLog,
  habitRate,
  logHabit,
  toggleHabitDay,
  updateHabit,
  useAlba,
} from '../store'
import { WEEKDAY_SHORT, lastNDays, todayISO } from '../lib/dates'
import { HABIT_PRESETS } from '../seed'

const EMPTY = { name: '', identity: '', trigger: '', action: '', tiny: '', days: null }

function WeekdayPicker({ value, onToggle }) {
  const selected = habitDays({ days: value })
  return (
    <div className="weekday-row" role="group" aria-label="Wochentage">
      {WEEKDAY_SHORT.map((label, i) => {
        const id = i + 1
        return (
          <button
            key={id}
            type="button"
            className={'chip' + (selected.includes(id) ? ' active' : '')}
            onClick={() => onToggle(id)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function Habits() {
  const s = useAlba()
  const habits = activeHabits(s)
  const date = todayISO()
  const days = lastNDays(date, 28)
  const [draft, setDraft] = useState(null)
  const [openId, setOpenId] = useState(null)

  function save() {
    const name = draft.name.trim()
    const trigger = draft.trigger.trim()
    if (!name) return
    if (!trigger) return
    addHabit({
      name,
      trigger,
      identity: draft.identity.trim() || `Ich bin jemand, der ${name.toLowerCase()} tut.`,
      action: (draft.action || name).trim(),
      tiny: draft.tiny.trim() || 'Zwei Minuten. Die kleinste Version.',
      days: draft.days || null,
    })
    setDraft(null)
  }

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">Automatik</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Routinen
        </h1>
        <p className="month">
          Winzig, an etwas Bestehendes gehängt. Karte aufklappen zum Einrichten — abhaken auf Heute.
        </p>
      </div>

      {habits.map((h) => {
        const rate = Math.round(habitRate(s, h.id, days) * 100)
        const eligible = habitEligibleDays(h, days)
        const hits = eligible.filter((d) => habitLog(s, h.id, d)).length
        const open = openId === h.id
        const todayVal = habitLog(s, h.id, date)
        return (
          <article className={'habit-card' + (open ? ' open' : '')} key={h.id}>
            <button
              type="button"
              className="habit-fold"
              onClick={() => setOpenId(open ? null : h.id)}
              aria-expanded={open}
            >
              <span>
                <h3>{h.name}</h3>
                <p className="habit-cue">
                  {h.trigger ? `${h.trigger} → ${h.action || h.name}` : 'Ohne Anker'}
                </p>
                <span className="rate">
                  {habitDaysLabel(h)}
                  {eligible.length ? ` · ${hits} von ${eligible.length}` : ''}
                  {eligible.length >= 7 ? ` · ${rate}%` : ''}
                  {todayVal ? ' · heute gehalten' : ''}
                </span>
              </span>
              <span className="habit-chevron" aria-hidden="true">
                {open ? '–' : '+'}
              </span>
            </button>
            {open && (
              <div className="habit-body">
                <div className="field">
                  <label>Name</label>
                  <input value={h.name} onChange={(e) => updateHabit(h.id, { name: e.target.value })} />
                </div>
                <div className="field">
                  <label>Anker — danach oder dann</label>
                  <input
                    value={h.trigger}
                    onChange={(e) => updateHabit(h.id, { trigger: e.target.value })}
                    placeholder="Nach dem Kaffee / Um 22:30"
                  />
                </div>
                <div className="field">
                  <label>Mini — für den schlechten Tag</label>
                  <input
                    value={h.tiny}
                    onChange={(e) => updateHabit(h.id, { tiny: e.target.value })}
                    placeholder="Schuhe an. Eine Seite. Licht dimmen."
                  />
                </div>
                <div className="field">
                  <label>Identität</label>
                  <input
                    value={h.identity}
                    onChange={(e) => updateHabit(h.id, { identity: e.target.value })}
                    placeholder="Ich bin jemand, der…"
                  />
                </div>
                <div className="field">
                  <label>Wochentage</label>
                  <WeekdayPicker value={h.days} onToggle={(day) => toggleHabitDay(h.id, day)} />
                </div>
                <div className="lattice" style={{ margin: '16px 0' }}>
                  {days.map((d) => {
                    const val = habitLog(s, h.id, d)
                    const due = habitDueOn(h, d)
                    const loggable = due && canLogHabit(d, date)
                    return (
                      <button
                        key={d}
                        className={
                          'pebble' +
                          (val === 'full' ? ' full' : val === 'tiny' ? ' tiny' : '') +
                          (d === date ? ' today' : '') +
                          (!due ? ' off' : '')
                        }
                        disabled={!loggable}
                        onClick={() => loggable && logHabit(h.id, d, val ? null : 'full')}
                        title={d}
                      />
                    )
                  })}
                </div>
                <div className="row-btns">
                  <button className="chip warn" onClick={() => archiveHabit(h.id)}>
                    Archivieren
                  </button>
                </div>
              </div>
            )}
          </article>
        )
      })}

      {draft && (
        <article className="habit-card">
          <h3>Neue Routine</h3>
          <div className="field">
            <label>Name</label>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Was tust du regelmäßig?"
            />
          </div>
          <div className="field">
            <label>Anker — Pflicht</label>
            <input
              value={draft.trigger}
              onChange={(e) => setDraft({ ...draft, trigger: e.target.value })}
              placeholder="Nach dem Aufstehen"
            />
          </div>
          <div className="field">
            <label>Mini-Version</label>
            <input
              value={draft.tiny}
              onChange={(e) => setDraft({ ...draft, tiny: e.target.value })}
              placeholder="Zwei Minuten. Schuhe an."
            />
          </div>
          <div className="field">
            <label>Identität</label>
            <input
              value={draft.identity}
              onChange={(e) => setDraft({ ...draft, identity: e.target.value })}
              placeholder="Ich bin jemand, der…"
            />
          </div>
          <div className="field">
            <label>Wochentage</label>
            <WeekdayPicker
              value={draft.days}
              onToggle={(day) => {
                const current = habitDays({ days: draft.days })
                const has = current.includes(day)
                let next = has ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)
                if (!next.length) return
                setDraft({ ...draft, days: next.length === 7 ? null : next })
              }}
            />
          </div>
          {HABIT_PRESETS.filter((p) => !habits.some((h) => h.name === p.name)).length > 0 && (
            <div className="destinations">
              {HABIT_PRESETS.filter((p) => !habits.some((h) => h.name === p.name)).map((p) => (
                <button key={p.name} className="chip" type="button" onClick={() => setDraft({ ...p })}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
          <div className="row-btns">
            <button className="btn" onClick={save} disabled={!draft.name.trim() || !draft.trigger.trim()}>
              Anlegen
            </button>
            <button className="btn ghost" onClick={() => setDraft(null)}>
              Abbrechen
            </button>
          </div>
        </article>
      )}

      {!draft && habits.length < MAX_HABITS && (
        <button className="btn ghost" onClick={() => setDraft({ ...EMPTY })}>
          Routine anlegen
        </button>
      )}
      {!draft && habits.length >= MAX_HABITS && (
        <p className="quiet" style={{ marginTop: 12 }}>
          Fünf reichen. Weniger wird automatischer.
        </p>
      )}
    </div>
  )
}
