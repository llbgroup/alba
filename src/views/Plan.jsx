import { useState } from 'react'
import {
  addTheme,
  horizonThemes,
  monthThemes,
  placeThemeOnWeek,
  setThemeStatus,
  setWeekGoalStatus,
  useAlba,
  weekGoalsByTheme,
} from '../store'
import {
  formatMonthKey,
  formatWeekRange,
  isoWeekKey,
  monthKeyFromISO,
  todayISO,
  upcomingWeekKeys,
} from '../lib/dates'

const MONTHS = ['2026-09', '2026-10', '2026-11', '2026-12']

export default function Plan() {
  const s = useAlba()
  const today = todayISO()
  const currentMonth = monthKeyFromISO(today)
  const currentWeek = isoWeekKey(today)
  const weeks = upcomingWeekKeys(today, 16)
  const [openMonth, setOpenMonth] = useState(currentMonth)
  const [draft, setDraft] = useState(null)
  const [weekDraft, setWeekDraft] = useState(null)
  const horizon = horizonThemes(s)

  const byArea = (list) => {
    const map = new Map()
    for (const t of list) {
      if (!map.has(t.areaId)) map.set(t.areaId, [])
      map.get(t.areaId).push(t)
    }
    return s.areas
      .map((a) => ({ area: a, items: map.get(a.id) || [] }))
      .filter((x) => x.items.length)
  }

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">Richtung</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Plan
        </h1>
        <p className="month">Oberaufgabe, dann Wochenfokus — auch Monate voraus. Den Tag brichst du erst, wenn er da ist.</p>
      </div>

      <div className="horizon">
        {byArea(horizon).map(({ area, items }) => (
          <article className="horizon-card" key={area.id}>
            <span className={'pip ' + area.tone}>
              <i />
              {area.name}
            </span>
            <h3>{area.name}</h3>
            <ul>
              {items.map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {MONTHS.map((key) => {
        const themes = monthThemes(s, key)
        const open = openMonth === key
        return (
          <section className="month-block" key={key}>
            <button className="btn quiet" onClick={() => setOpenMonth(open ? '' : key)}>
              <h3 style={{ margin: 0 }}>
                {formatMonthKey(key)}
                {key === currentMonth ? ' · jetzt' : ''}
              </h3>
            </button>
            {open && (
              <>
                {byArea(themes).map(({ area, items }) => (
                  <div key={area.id}>
                    <p className="group-label">{area.name}</p>
                    {items.map((t) => {
                      const children = weekGoalsByTheme(s, t.id)
                      return (
                        <div className="theme-block" key={t.id}>
                          <div className="theme-row">
                            <div>
                              <p
                                style={{
                                  textDecoration: t.status === 'done' ? 'line-through' : 'none',
                                  margin: 0,
                                  fontWeight: 600,
                                }}
                              >
                                {t.title}
                              </p>
                              <span className={'pip ' + area.tone}>
                                <i />
                                {area.name}
                              </span>
                            </div>
                            <button
                              className="chip"
                              onClick={() =>
                                setThemeStatus(t.id, t.status === 'done' ? 'open' : 'done')
                              }
                            >
                              {t.status === 'done' ? 'Offen' : 'Durch'}
                            </button>
                          </div>
                          {children.map((g) => (
                            <div className="week-line" key={g.id}>
                              <span className="quiet">{formatWeekRange(g.weekKey)}</span>
                              <p className={g.status === 'done' ? 'done' : ''}>{g.title}</p>
                              <button
                                className="chip"
                                onClick={() =>
                                  setWeekGoalStatus(g.id, g.status === 'done' ? 'open' : 'done')
                                }
                              >
                                {g.status === 'done' ? 'Offen' : 'Fertig'}
                              </button>
                            </div>
                          ))}
                          {weekDraft?.themeId === t.id ? (
                            <div className="week-draft">
                              <input
                                autoFocus
                                placeholder="Was ist der Fokus dieser Woche?"
                                value={weekDraft.title}
                                onChange={(e) => setWeekDraft({ ...weekDraft, title: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    placeThemeOnWeek(t.id, weekDraft.weekKey, weekDraft.title)
                                    setWeekDraft(null)
                                  }
                                }}
                              />
                              <div className="destinations">
                                {weeks.map((w, i) => (
                                  <button
                                    key={w}
                                    className={'chip' + (weekDraft.weekKey === w ? ' active' : '')}
                                    onClick={() => setWeekDraft({ ...weekDraft, weekKey: w })}
                                  >
                                    {w === currentWeek ? 'Diese Woche' : i === 1 ? 'Nächste' : formatWeekRange(w)}
                                  </button>
                                ))}
                              </div>
                              <div className="row-btns">
                                <button
                                  className="btn"
                                  onClick={() => {
                                    placeThemeOnWeek(t.id, weekDraft.weekKey, weekDraft.title)
                                    setWeekDraft(null)
                                  }}
                                >
                                  Halten
                                </button>
                                <button className="btn ghost" onClick={() => setWeekDraft(null)}>
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="btn quiet"
                              onClick={() =>
                                setWeekDraft({ themeId: t.id, weekKey: currentWeek, title: '' })
                              }
                            >
                              + Wochenfokus
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
                {draft?.monthKey === key ? (
                  <div className="field">
                    <label>Neue Oberaufgabe</label>
                    <input
                      autoFocus
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      placeholder="Was trägt der Monat?"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addTheme({ monthKey: key, areaId: draft.areaId, title: draft.title })
                          setDraft(null)
                        }
                      }}
                    />
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
                          addTheme({ monthKey: key, areaId: draft.areaId, title: draft.title })
                          setDraft(null)
                        }}
                      >
                        Halten
                      </button>
                      <button className="btn ghost" onClick={() => setDraft(null)}>
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="btn ghost"
                    style={{ marginTop: 12 }}
                    onClick={() => setDraft({ monthKey: key, areaId: null, title: '' })}
                  >
                    Oberaufgabe hinzufügen
                  </button>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
