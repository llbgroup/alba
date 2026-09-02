import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { applyVoiceClose, closeDay, getDay, useAlba } from '../store'
import { todayISO } from '../lib/dates'
import { structureEvening } from '../lib/voice'

function SpeechEngine() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function CloseDay({ open, onClose, seed = null }) {
  const s = useAlba()
  const date = todayISO()
  const day = getDay(s, date)
  const [good, setGood] = useState(day.good?.length ? [...day.good] : ['', '', ''])
  const [log, setLog] = useState(day.log || '')
  const [learned, setLearned] = useState(day.learned || '')
  const [tomorrow, setTomorrow] = useState(day.tomorrow || '')
  const [transcript, setTranscript] = useState(day.transcript || '')
  const [live, setLive] = useState('')
  const [listening, setListening] = useState(false)
  const [tasks, setTasks] = useState([])
  const recRef = useRef(null)
  const baseRef = useRef('')

  useEffect(() => {
    if (!open) {
      stop()
      return
    }
    if (seed?.transcript) {
      applyStructured(seed)
    } else {
      const fresh = getDay(s, date)
      setGood(fresh.good?.length ? [...fresh.good] : ['', '', ''])
      setLog(fresh.log || '')
      setLearned(fresh.learned || '')
      setTomorrow(fresh.tomorrow || '')
      setTranscript(fresh.transcript || '')
      setTasks([])
    }
  }, [open])

  useEffect(() => () => stop(), [])

  function stop() {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
  }

  function start() {
    const Ctor = SpeechEngine()
    if (!Ctor) {
      alert('Spracheingabe braucht Safari oder Chrome.')
      return
    }
    stop()
    const rec = new Ctor()
    rec.lang = 'de-DE'
    rec.continuous = true
    rec.interimResults = true
    baseRef.current = transcript ? transcript + ' ' : ''
    rec.onresult = (ev) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript
        if (ev.results[i].isFinal) final += t + ' '
        else interim += t
      }
      const next = (baseRef.current + final).replace(/\s+/g, ' ').trim()
      setTranscript(next)
      setLive(interim)
    }
    rec.onend = () => {
      if (recRef.current === rec) {
        try {
          rec.start()
        } catch {
          setListening(false)
        }
      }
    }
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }

  function toggleMic() {
    if (listening) {
      stop()
      const structured = structureEvening(transcript + ' ' + live, s.areas)
      applyStructured(structured)
    } else {
      start()
    }
  }

  function applyStructured(structured) {
    setTranscript(structured.transcript || transcript)
    setLog(structured.log || '')
    setLearned(structured.learned || '')
    setTomorrow(structured.tomorrow || '')
    setGood(structured.good?.length ? structured.good : ['', '', ''])
    setTasks(structured.tasks || [])
  }

  function structureNow() {
    applyStructured(structureEvening(transcript, s.areas))
  }

  function submit() {
    stop()
    applyVoiceClose(
      {
        good,
        log,
        learned,
        tomorrow,
        transcript,
        tasks,
      },
      date,
    )
    onClose()
  }

  function saveTyped() {
    stop()
    closeDay({ good, log, learned, tomorrow, transcript }, date)
    onClose()
  }

  if (!open) return null

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <p className="step-count">Abend</p>
        <h2>Erzähl den Tag</h2>
        <p className="lead">
          Einfach sprechen: was war, wie es war, was morgen kommt. Alba sortiert — der Eintrag liegt danach im Log.
        </p>

        <button className={'btn mic' + (listening ? ' live' : '')} onClick={toggleMic}>
          {listening ? 'Aufnahme stoppen' : 'Sprechen'}
        </button>
        <p className="hint">
          {SpeechEngine()
            ? listening
              ? 'Ich höre zu…'
              : 'Stoppen strukturiert automatisch.'
            : 'In diesem Browser keine Sprache — unten tippen.'}
        </p>

        <div className="transcript">
          {transcript || live ? (
            <>
              {transcript} {live && <em style={{ color: 'var(--ink-3)' }}>{live}</em>}
            </>
          ) : (
            <span className="quiet">Noch nichts gesagt.</span>
          )}
        </div>

        {transcript && (
          <button className="btn ghost" onClick={structureNow} style={{ marginTop: 12 }}>
            Nochmal strukturieren
          </button>
        )}

        <div className="field">
          <label>Drei gute Dinge</label>
          {good.map((g, i) => (
            <input
              key={i}
              value={g}
              placeholder={`${i + 1}.`}
              onChange={(e) => setGood((arr) => arr.map((x, idx) => (idx === i ? e.target.value : x)))}
            />
          ))}
        </div>
        <div className="field">
          <label>Was passiert ist</label>
          <textarea value={log} onChange={(e) => setLog(e.target.value)} placeholder="Fakten." />
        </div>
        <div className="field">
          <label>Ein Satz</label>
          <input
            value={learned}
            onChange={(e) => setLearned(e.target.value)}
            placeholder="Was bleibt?"
          />
        </div>
        <div className="field">
          <label>Morgen</label>
          <input
            value={tomorrow}
            onChange={(e) => setTomorrow(e.target.value)}
            placeholder="Wenn der Tag beginnt…"
          />
        </div>
        {tasks.length > 0 && (
          <div className="field">
            <label>Morgen als Aufgaben</label>
            {tasks.map((t, i) => (
              <input
                key={i}
                value={t.title}
                onChange={(e) =>
                  setTasks((arr) => arr.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))
                }
              />
            ))}
          </div>
        )}

        <div className="row-btns">
          <button className="btn" onClick={submit}>
            Tag schließen
          </button>
          <button className="btn ghost" onClick={saveTyped}>
            Nur schreiben
          </button>
          <button className="btn quiet" onClick={onClose}>
            Offen lassen
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
