import { useEffect, useState } from 'react'
import {
  areaById,
  deleteJournalEntry,
  logDays,
  toggleTask,
  useAlba,
} from '../store'
import TrashBtn from '../components/Trash'
import {
  dayNum,
  dowName,
  formatMedium,
  formatMonthKey,
  formatWeekRange,
  monthKeyFromISO,
  todayISO,
} from '../lib/dates'

function dateFromHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '')
  const m = raw.match(/^log\/(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : ''
}

function daySummary(g) {
  const bits = []
  if (g.done.length) bits.push(`${g.done.length} erledigt`)
  if (g.habits.length) bits.push(`${g.habits.length} Routine${g.habits.length === 1 ? '' : 'n'}`)
  if (g.entries.length || g.closed) bits.push('Abend')
  if (g.ideas.length) bits.push(`${g.ideas.length} Idee${g.ideas.length === 1 ? '' : 'n'}`)
  if (g.created.length) bits.push(`${g.created.length} neu`)
  if (!bits.length && g.highlight) return g.highlight
  return bits.join(' · ')
}

function openIdea(id) {
  try {
    localStorage.setItem('alba.idea.v1', id)
  } catch {
    /* ignore */
  }
  location.hash = '#/ideas'
}

export default function Log() {
  const s = useAlba()
  const days = logDays(s)
  const [query, setQuery] = useState('')
  const [openDate, setOpenDate] = useState(dateFromHash)
  const today = todayISO()

  useEffect(() => {
    const onHash = () => setOpenDate(dateFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const q = query.trim().toLowerCase()
  const shown = days.filter((d) => !q || d.hay.includes(q))
  const open = shown.find((d) => d.date === openDate) || days.find((d) => d.date === openDate) || null

  const groups = []
  const map = new Map()
  for (const d of shown) {
    const key = monthKeyFromISO(d.date)
    if (!map.has(key)) {
      const g = { key, days: [] }
      map.set(key, g)
      groups.push(g)
    }
    map.get(key).days.push(d)
  }

  function goList() {
    location.hash = '#/log'
  }

  function goDay(date) {
    location.hash = '#/log/' + date
  }

  if (open) {
    return (
      <DayPage
        day={open}
        today={today}
        onBack={goList}
      />
    )
  }

  return (
    <div className="page journal-page">
      <div className="dateblock">
        <p className="dow">Speicher</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Log
        </h1>
        <p className="month">Jeder Tag ein Blatt. Was gehalten, was angelegt, was erzählt.</p>
      </div>

      <div className="field" style={{ marginTop: 8 }}>
        <label>Suchen</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="To-dos, Abende, Ideen…"
        />
      </div>

      {shown.length === 0 && (
        <p className="empty">Noch leer. Abhaken und abends erzählen füllt die Tage.</p>
      )}

      {groups.map((g) => (
        <section key={g.key}>
          <p className="group-label">{formatMonthKey(g.key)}</p>
          {g.days.map((d) => (
            <button type="button" className="log-day" key={d.date} onClick={() => goDay(d.date)}>
              <span className="log-day-num">{dayNum(d.date)}</span>
              <span>
                <span className="log-day-name">
                  {dowName(d.date)}
                  {d.date === today ? ' · heute' : ''}
                </span>
                <span className="log-day-sum">{daySummary(d)}</span>
              </span>
            </button>
          ))}
        </section>
      ))}
    </div>
  )
}

function DayPage({ day, today, onBack }) {
  const s = useAlba()
  const isToday = day.date === today

  return (
    <div className="page journal-page">
      <div className="dateblock">
        <p className="dow">
          <button type="button" className="log-back" onClick={onBack}>
            Log
          </button>
        </p>
        <h1 className="daynum">{dayNum(day.date)}</h1>
        <p className="month">
          {dowName(day.date)}, {formatMedium(day.date)}
          {isToday ? ' · heute' : ''}
        </p>
      </div>

      {day.highlight ? (
        <section className="log-block">
          <p className="section-label">Heute zählt</p>
          <p className="log-hl">{day.highlight}</p>
        </section>
      ) : null}

      {day.entries.map((entry) => (
        <section className="log-block" key={entry.id}>
          <p className="section-label">{entry.source === 'evening' ? 'Abend' : 'Eintrag'}</p>
          {entry.title ? <p className="log-hl">{entry.title}</p> : null}
          <Block title="Was war" items={entry.facts} />
          <Block title="Entscheidungen" items={entry.decisions} />
          <Block title="Offene Fragen" items={entry.questions} />
          <Block title="Energie" items={entry.energy} />
          <Block title="Als nächstes" items={entry.next} />
          {entry.transcript ? (
            <details className="raw-fold">
              <summary>Rohtranskript</summary>
              <p>{entry.transcript}</p>
            </details>
          ) : null}
          <div className="row-btns">
            <TrashBtn onClick={() => deleteJournalEntry(entry.id)} />
          </div>
        </section>
      ))}

      {!day.entries.length && (day.log || day.learned || day.good.length || day.tomorrow) ? (
        <section className="log-block">
          <p className="section-label">Abend</p>
          {day.learned ? <p className="log-hl">{day.learned}</p> : null}
          <Block title="Was war" items={day.log ? [day.log] : []} />
          <Block title="Energie" items={day.good} />
          <Block title="Als nächstes" items={day.tomorrow ? [day.tomorrow] : []} />
        </section>
      ) : null}

      {day.done.length > 0 && (
        <section className="log-block">
          <p className="section-label">Erledigt</p>
          {day.done.map((t) => {
            const area = areaById(s, t.areaId)
            return (
              <button
                type="button"
                key={t.id}
                className="log-line done"
                onClick={() => toggleTask(t.id)}
              >
                <span className="check on" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12.5l5 5L19 7" />
                  </svg>
                </span>
                <span>
                  {t.title}
                  {area ? <span className="quiet"> · {area.name}</span> : null}
                </span>
              </button>
            )
          })}
        </section>
      )}

      {day.habits.length > 0 && (
        <section className="log-block">
          <p className="section-label">Routinen</p>
          {day.habits.map((h) => (
            <p key={h.id} className="log-line done static">
              <span className="check on" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12.5l5 5L19 7" />
                </svg>
              </span>
              <span>
                {h.name}
                {h.value === 'tiny' ? <span className="quiet"> · Mini</span> : null}
              </span>
            </p>
          ))}
        </section>
      )}

      {(day.created.length > 0 || day.ideas.length > 0) && (
        <section className="log-block">
          <p className="section-label">Angelegt</p>
          {day.created.map((t) => (
            <p key={t.id} className="log-line kind static">
              <span className="log-kind">To-do</span>
              <span>{t.title}</span>
            </p>
          ))}
          {day.ideas.map((idea) => (
            <button
              type="button"
              key={idea.id}
              className="log-line kind"
              onClick={() => openIdea(idea.id)}
            >
              <span className="log-kind">Idee</span>
              <span>{idea.title.trim() || 'Ohne Titel'}</span>
            </button>
          ))}
        </section>
      )}

      {day.weeks.length > 0 && (
        <section className="log-block">
          <p className="section-label">Wochen</p>
          {day.weeks.map((w) => (
            <p key={w.id} className="log-line kind static">
              <span className="log-kind">Woche</span>
              <span>
                {w.title}
                {w.weekKey ? <span className="quiet"> · {formatWeekRange(w.weekKey)}</span> : null}
              </span>
            </p>
          ))}
        </section>
      )}
    </div>
  )
}

function Block({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="entry-block">
      <span className="quiet">{title}</span>
      <ul>
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  )
}
