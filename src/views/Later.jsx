import { useState } from 'react'
import TaskItem from '../components/TaskItem'
import {
  inboxTasks,
  laterTasks,
  upcomingGrouped,
  useAlba,
} from '../store'
import { formatLong } from '../lib/dates'

export default function Later() {
  const s = useAlba()
  const inbox = inboxTasks(s)
  const upcoming = upcomingGrouped(s)
  const anytime = laterTasks(s, 'anytime')
  const someday = laterTasks(s, 'someday')
  const [q, setQ] = useState('')

  function filter(list) {
    if (!q.trim()) return list
    const n = q.toLowerCase()
    return list.filter((t) => t.title.toLowerCase().includes(n))
  }

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">Nicht heute</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Später
        </h1>
        <p className="month">Eingang, Termine, Bereitschaft, Irgendwann.</p>
      </div>
      <div className="field">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suchen"
        />
      </div>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Eingang</span>
          <span className="quiet">{inbox.length}</span>
        </div>
        {inbox.length === 0 && <p className="empty">Leer. So soll er sein.</p>}
        {filter(inbox).map((t) => (
          <TaskItem key={t.id} task={t} allowDelete />
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Kommend</span>
        </div>
        {upcoming.length === 0 && <p className="empty">Nichts Datierteres.</p>}
        {upcoming.map((g) => (
          <div key={g.date || 'x'}>
            <p className="group-label">{g.date ? formatLong(g.date) : 'Ohne Tag'}</p>
            {filter(g.tasks).map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </div>
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Jederzeit</span>
          <span className="quiet">{anytime.length}</span>
        </div>
        <p className="quiet" style={{ marginTop: -6, marginBottom: 8 }}>
          Bereit, aber ohne Datum. Heute bleibt heilig.
        </p>
        {filter(anytime).map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </section>

      <section className="section">
        <div className="section-head">
          <span className="section-label">Irgendwann</span>
          <span className="quiet">{someday.length}</span>
        </div>
        <p className="quiet" style={{ marginTop: -6, marginBottom: 8 }}>
          Kein Schuldgefühl. Ein Parkplatz.
        </p>
        {filter(someday).map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </section>
    </div>
  )
}
