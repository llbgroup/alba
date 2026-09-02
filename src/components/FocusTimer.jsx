import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  clearFocus,
  pauseFocus,
  resumeFocus,
  startFocus,
  todayTasks,
  useAlba,
} from '../store'
import { todayISO } from '../lib/dates'

function formatMs(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

export default function FocusTimer({ quiet = false }) {
  const s = useAlba()
  const tasks = todayTasks(s, todayISO()).filter((t) => t.status === 'open')
  const [mins, setMins] = useState(25)
  const [pick, setPick] = useState(tasks[0]?.id || null)
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  const focus = s.focus
  const running = Boolean(focus?.running)

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => setTick((n) => n + 1), 250)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!pick && tasks[0]) setPick(tasks[0].id)
  }, [tasks, pick])

  const left = running && focus?.endsAt ? Math.max(0, focus.endsAt - Date.now()) : focus?.remainingMs ?? mins * 60 * 1000
  const finished = running && left <= 0
  const current = s.tasks.find((t) => t.id === (focus?.taskId || pick))
  const live = running || Boolean(focus?.remainingMs) || finished

  function start() {
    startFocus(pick || tasks[0]?.id, mins)
    setOpen(false)
  }

  const face = (
    <button
      className="timer-launch"
      onClick={() => setOpen(true)}
      aria-label={running ? 'Fokus läuft' : 'Fokus einstellen'}
    >
      <p className="timer-face">{finished ? '00:00' : formatMs(left)}</p>
      {!quiet && (
        <p className="quiet">
          {finished ? 'Phase vorbei.' : current ? current.title : 'Tippen zum Einstellen'}
        </p>
      )}
    </button>
  )

  const controls = finished ? (
    <button className={quiet ? 'timer-ctrl' : 'btn'} onClick={() => clearFocus()}>
      {quiet ? 'Klar' : 'Schließen'}
    </button>
  ) : running ? (
    <button className={quiet ? 'timer-ctrl' : 'btn ghost'} onClick={pauseFocus}>
      Pause
    </button>
  ) : focus?.remainingMs ? (
    <button className={quiet ? 'timer-ctrl' : 'btn'} onClick={resumeFocus}>
      Weiter
    </button>
  ) : quiet ? (
    <button className="timer-set" onClick={() => setOpen(true)}>
      Timer setzen
    </button>
  ) : (
    <button className="btn quiet" onClick={() => setOpen(true)}>
      Einstellen
    </button>
  )

  return (
    <div className={'timer-compact' + (quiet ? ' quiet' : '') + (live ? ' is-live' : '')}>
      {!quiet && (
        <div className="section-head">
          <span className="section-label">Fokus</span>
          <span className="quiet">{focus?.durationMin || mins} Min</span>
        </div>
      )}
      {face}
      {controls && (quiet ? controls : <div className="row-btns" style={{ justifyContent: 'center' }}>{controls}</div>)}

      {open &&
        createPortal(
          <div className="overlay" onClick={() => setOpen(false)}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <p className="step-count">Fokus</p>
              <h2>{finished ? 'Pause.' : running ? 'Läuft.' : 'Eine Sache.'}</h2>
              <p className="timer-face">{finished ? '00:00' : formatMs(left)}</p>
              <p className="lead">
                {current ? current.title : 'Wähl eine Sache von heute, dann die Länge.'}
              </p>
              {!running && !focus?.remainingMs && (
                <>
                  <div className="destinations">
                    {[25, 50].map((n) => (
                      <button key={n} className={'chip' + (mins === n ? ' active' : '')} onClick={() => setMins(n)}>
                        {n} Min
                      </button>
                    ))}
                  </div>
                  {tasks.length > 0 && (
                    <div className="field">
                      <label>Woran</label>
                      <select value={pick || ''} onChange={(e) => setPick(e.target.value)}>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
              <div className="row-btns">
                {finished ? (
                  <button className="btn" onClick={() => { clearFocus(); setOpen(false) }}>
                    Schließen
                  </button>
                ) : running ? (
                  <button className="btn ghost" onClick={pauseFocus}>
                    Pause
                  </button>
                ) : focus?.remainingMs ? (
                  <>
                    <button className="btn" onClick={resumeFocus}>
                      Weiter
                    </button>
                    <button className="btn ghost" onClick={() => { clearFocus(); setOpen(false) }}>
                      Abbrechen
                    </button>
                  </>
                ) : (
                  <button className="btn" onClick={start}>
                    Start
                  </button>
                )}
                <button className="btn quiet" onClick={() => setOpen(false)}>
                  Zurück
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
