import { useEffect, useRef, useState } from 'react'
import TaskItem from '../components/TaskItem'
import CarryOver from '../components/CarryOver'
import CloseDay from '../components/CloseDay'
import FocusTimer from '../components/FocusTimer'
import HabitTrack from '../components/HabitTrack'
import {
  MAX_MITS,
  addDaily,
  dropTask,
  getDay,
  pullToToday,
  reopenDay,
  setHighlight,
  staleTasks,
  todayTasks,
  useAlba,
  weekAim,
} from '../store'
import { addDays, dayNum, dowName, isoWeekKey, monthName, todayISO, yearOf } from '../lib/dates'
import TrashBtn from '../components/Trash'
import { quoteFor } from '../lib/quotes'
import { SpeechEngine, createRecognition } from '../lib/speech'
import { structureEvening } from '../lib/voice'

export default function Today() {
  const s = useAlba()
  const date = todayISO()
  const tomorrow = addDays(date, 1)
  const day = getDay(s, date)
  const tasks = todayTasks(s, date)
  const parked = (s.tasks || []).filter((t) => t.status === 'open' && t.date === tomorrow)
  const stale = staleTasks(s, date)
  const [carry, setCarry] = useState(false)
  const [close, setClose] = useState(false)
  const [seed, setSeed] = useState(null)
  const [listening, setListening] = useState(false)
  const [live, setLive] = useState('')
  const [heard, setHeard] = useState('')
  const recRef = useRef(null)
  const committedRef = useRef('')
  const keepRef = useRef(false)
  const [loose, setLoose] = useState('')
  const [parkMode, setParkMode] = useState(false)
  const [quoteShift, setQuoteShift] = useState(0)
  const quote = quoteFor(date, quoteShift)

  const open = tasks.filter((t) => t.status === 'open')
  const done = tasks.filter((t) => t.status === 'done')
  const weekFocus = weekAim(s, isoWeekKey(date))

  useEffect(() => () => stopMic(), [])

  function stopMic() {
    keepRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
    setLive('')
  }

  function startMic() {
    stopMic()
    committedRef.current = heard
    keepRef.current = true
    const rec = createRecognition({
      onFinal: (chunk) => {
        committedRef.current = (committedRef.current + ' ' + chunk).replace(/\s+/g, ' ').trim()
        setHeard(committedRef.current)
      },
      onInterim: (t) => setLive(t),
      onError: () => {
        keepRef.current = false
        setListening(false)
      },
      onEnd: () => {
        if (keepRef.current && recRef.current === rec) {
          try {
            rec.start()
          } catch {
            setListening(false)
          }
        } else {
          setListening(false)
        }
      },
    })
    if (!rec) {
      alert('Spracheingabe braucht Safari oder Chrome.')
      return
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      alert('Mikrofon nicht verfügbar.')
    }
  }

  function toggleMic() {
    if (listening) {
      const text = (committedRef.current + ' ' + live).replace(/\s+/g, ' ').trim()
      stopMic()
      if (text) {
        setSeed(structureEvening(text, s.areas))
        setClose(true)
      }
    } else {
      startMic()
    }
  }

  function addUnder(text, forTomorrow) {
    const title = (text || '').trim()
    if (!title) return
    addDaily(title, null, forTomorrow ? tomorrow : date)
    setLoose('')
  }

  return (
    <>
      <div className="layout today">
        <header className="today-hero">
          <div className="hero-top">
            <div className="dateblock">
              <p className="dow">{dowName(date)}</p>
              <h1 className="daynum">{dayNum(date)}</h1>
              <p className="month">
                {monthName(date)} {yearOf(date)}
              </p>
              {weekFocus && <p className="week-aim">{weekFocus.title}</p>}
            </div>
            <FocusTimer quiet />
          </div>
          <div className="hero-rule" aria-hidden="true" />
          <blockquote
            className="day-quote"
            onClick={() => setQuoteShift((n) => n + 1)}
            title="Tippen für ein anderes"
          >
            <p>{quote.text}</p>
            <cite>{quote.by}</cite>
          </blockquote>
        </header>

        <div className="today-body">
        <aside>
          <HabitTrack />
        </aside>
        <div>
          {!carry && stale.length > 0 && (
            <button className="btn ghost" onClick={() => setCarry(true)}>
              {stale.length} von gestern
            </button>
          )}

          <div className="highlight">
            <div className="kicker">
              <span>Heute zählt</span>
              <span className="quiet">eins</span>
            </div>
            <textarea
              rows={2}
              placeholder="Wenn heute nur eines gelingt…"
              value={day.highlight || ''}
              onChange={(e) => setHighlight(e.target.value, date)}
            />
          </div>

          <section className="section">
            <div className="section-head">
              <span className="section-label">Heute</span>
              <span className="quiet">
                {open.length}/{MAX_MITS} offen
              </span>
            </div>
            {tasks.length === 0 && (
              <p className="empty">Nichts für heute. Schreib eins, oder datier etwas im Board.</p>
            )}
            {open.map((t, i) => (
              <TaskItem key={t.id} task={t} index={i + 1} compact />
            ))}
            <Parked items={parked} />
            <form
              className="inline-add"
              onSubmit={(e) => {
                e.preventDefault()
                if (!loose.trim()) return
                addUnder(loose, parkMode)
                setParkMode(false)
              }}
            >
              <span className="plus">+</span>
              <input
                value={loose}
                onChange={(e) => setLoose(e.target.value)}
                placeholder={parkMode ? 'Für morgen' : 'Was tust du heute?'}
              />
              <button
                type="button"
                className={'chip' + (parkMode ? ' active' : '')}
                onClick={() => setParkMode((v) => !v)}
              >
                Morgen
              </button>
            </form>
            {done.length > 0 && (
              <>
                <p className="done-label">Getan</p>
                {done.map((t) => (
                  <TaskItem key={t.id} task={t} compact />
                ))}
              </>
            )}
          </section>
        </div>
        </div>

        <section className="today-close">
          <p className="section-label">Abend</p>
          {day.closed ? (
            <>
              <p className="mic-lead">Tag geschlossen. Liegt im Log.</p>
              <button className="btn ghost" onClick={() => reopenDay(date)}>
                Wieder öffnen
              </button>
            </>
          ) : (
            <>
              <button
                className={'mic-orb' + (listening ? ' live' : '')}
                onClick={toggleMic}
                aria-label={listening ? 'Aufnahme stoppen' : 'Tag erzählen'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
                </svg>
              </button>
              <p className="mic-lead">
                {listening
                  ? 'Ich höre zu. Nochmal tippen sortiert den Tag.'
                  : SpeechEngine()
                    ? 'Wie war der Tag? Tippen, erzählen, nochmal tippen.'
                    : 'Dieser Browser hat keine Sprache. Unten schreiben.'}
              </p>
              {(heard || live) && (
                <p className="live-line">
                  {heard} {live && <em>{live}</em>}
                </p>
              )}
              {!listening && (
                <button
                  className="btn quiet"
                  onClick={() => {
                    setSeed(null)
                    setClose(true)
                  }}
                >
                  Oder schreiben
                </button>
              )}
            </>
          )}
        </section>
      </div>

      {carry && stale.length > 0 && <CarryOver items={stale} onClose={() => setCarry(false)} />}
      <CloseDay
        open={close}
        seed={seed}
        onClose={() => {
          setClose(false)
          setSeed(null)
          setHeard('')
          committedRef.current = ''
        }}
      />
    </>
  )
}

function Parked({ items }) {
  if (!items?.length) return null
  return (
    <div className="parked">
      <p className="quiet">Morgen bereit</p>
      {items.map((t) => (
        <div className="parked-item" key={t.id}>
          <span>{t.title}</span>
          <button className="chip" onClick={() => pullToToday(t.id)}>
            Heute
          </button>
          <TrashBtn onClick={() => dropTask(t.id)} />
        </div>
      ))}
    </div>
  )
}
