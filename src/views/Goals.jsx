import { useState } from 'react'
import {
  MAX_GOALS,
  activeGoals,
  addGoal,
  areaById,
  goalTouched,
  setGoalStatus,
  touchGoal,
  updateGoal,
  useAlba,
} from '../store'
import { lastNDays, todayISO } from '../lib/dates'

const EMPTY = { wish: '', outcome: '', obstacle: '', plan: '', areaId: 'privat' }

export default function Goals() {
  const s = useAlba()
  const active = activeGoals(s)
  const rest = s.goals.filter((g) => g.status !== 'active')
  const [draft, setDraft] = useState(null)
  const date = todayISO()
  const week = lastNDays(date, 7)

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">Richtung</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Ziele
        </h1>
        <p className="month">Wunsch, Ausgang, Hindernis, Plan. Nicht träumen ohne Reibung.</p>
      </div>

      {active.length === 0 && !draft && (
        <p className="empty">Kein aktives Ziel. Eines, das sich lohnt, reicht oft.</p>
      )}

      {active.map((g) => {
        const area = areaById(s, g.areaId)
        const touches = week.filter((d) => goalTouched(s, g.id, d)).length
        const today = goalTouched(s, g.id, date)
        return (
          <article className="goal-card" key={g.id}>
            <span className={'pip ' + (area?.tone || '')}>
              <i />
              {area?.name}
            </span>
            <h3>
              <input
                className="title-input"
                style={{ font: 'inherit' }}
                value={g.wish}
                onChange={(e) => updateGoal(g.id, { wish: e.target.value })}
              />
            </h3>
            <div className="woop">
              <div className="field">
                <label>Ausgang — wie fühlt sich das an?</label>
                <textarea
                  value={g.outcome}
                  onChange={(e) => updateGoal(g.id, { outcome: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Hindernis — inneres, nicht die Welt</label>
                <textarea
                  value={g.obstacle}
                  onChange={(e) => updateGoal(g.id, { obstacle: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Plan — Wenn Hindernis, dann Handlung</label>
                <textarea
                  value={g.plan}
                  onChange={(e) => updateGoal(g.id, { plan: e.target.value })}
                />
              </div>
            </div>
            <div className="row-btns">
              <button className={'chip' + (today ? ' active' : '')} onClick={() => touchGoal(g.id, date)}>
                {today ? 'Heute berührt' : 'Heute einen Schritt'}
              </button>
              <span className="rate">{touches}/7 Tage Prozess</span>
              <button className="chip" onClick={() => setGoalStatus(g.id, 'done')}>
                Erreicht
              </button>
              <button
                className="chip warn"
                onClick={() => setGoalStatus(g.id, 'released', 'Losgelassen')}
              >
                Loslassen
              </button>
            </div>
          </article>
        )
      })}

      {draft && (
        <article className="goal-card">
          <h3>Neues Ziel</h3>
          <div className="field">
            <label>Wunsch</label>
            <input
              value={draft.wish}
              onChange={(e) => setDraft({ ...draft, wish: e.target.value })}
              placeholder="In vier Wochen…"
            />
          </div>
          <div className="field">
            <label>Ausgang</label>
            <textarea
              value={draft.outcome}
              onChange={(e) => setDraft({ ...draft, outcome: e.target.value })}
              placeholder="Das beste Ergebnis, körperlich gespürt."
            />
          </div>
          <div className="field">
            <label>Hindernis</label>
            <textarea
              value={draft.obstacle}
              onChange={(e) => setDraft({ ...draft, obstacle: e.target.value })}
              placeholder="Was in dir steht im Weg? Müdigkeit, Ausweichen, Überplanen…"
            />
          </div>
          <div className="field">
            <label>Plan</label>
            <textarea
              value={draft.plan}
              onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
              placeholder="Wenn [Hindernis], dann [konkrete Handlung]."
            />
          </div>
          <div className="destinations">
            {s.areas.map((a) => (
              <button
                key={a.id}
                className={'chip' + (draft.areaId === a.id ? ' active' : '')}
                onClick={() => setDraft({ ...draft, areaId: a.id })}
              >
                {a.name}
              </button>
            ))}
          </div>
          <div className="row-btns">
            <button
              className="btn"
              onClick={() => {
                addGoal(draft)
                setDraft(null)
              }}
            >
              Halten
            </button>
            <button className="btn ghost" onClick={() => setDraft(null)}>
              Verwerfen
            </button>
          </div>
        </article>
      )}

      {!draft && (
        <button
          className="btn ghost"
          onClick={() => setDraft({ ...EMPTY })}
          disabled={active.length >= MAX_GOALS}
        >
          {active.length >= MAX_GOALS ? 'Drei aktive Ziele sind genug' : 'Ziel anlegen'}
        </button>
      )}

      {rest.length > 0 && (
        <section className="section">
          <span className="section-label">Abgeschlossen oder losgelassen</span>
          {rest.map((g) => (
            <p key={g.id} className="quiet" style={{ margin: '10px 0' }}>
              {g.status === 'done' ? 'Erreicht' : 'Losgelassen'} · {g.wish}
            </p>
          ))}
        </section>
      )}
    </div>
  )
}
