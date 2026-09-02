import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { capture, useAlba } from '../store'
import TagBar from './TagBar'
import { parseCapture } from '../lib/parse'
import { addDays, isoWeekKey, todayISO } from '../lib/dates'

const DEST = [
  { id: 'today', label: 'Heute' },
  { id: 'tomorrow', label: 'Morgen' },
  { id: 'week', label: 'Diese Woche' },
  { id: 'nextweek', label: 'Nächste Woche' },
  { id: 'inbox', label: 'Neu' },
]

export default function Capture({ open, onClose, defaultWhen = 'inbox' }) {
  const s = useAlba()
  const [text, setText] = useState('')
  const [when, setWhen] = useState(defaultWhen)
  const [areaId, setAreaId] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (open) {
      setText('')
      setWhen(defaultWhen)
      setAreaId(null)
      setTimeout(() => ref.current?.focus(), 40)
    }
  }, [open, defaultWhen])

  if (!open) return null

  function submit(forceToday = false) {
    const task = capture(text, {
      when: forceToday ? 'today' : when,
      forceToday,
      areaId,
    })
    if (task) onClose()
  }

  function onChange(v) {
    setText(v)
    const parsed = parseCapture(v, s.areas)
    if (parsed.when === 'inbox') return
    const tomorrow = addDays(todayISO(), 1)
    if (parsed.when === 'tomorrow' || parsed.date === tomorrow) setWhen('tomorrow')
    else if (parsed.when === 'today' || parsed.date === todayISO()) setWhen('today')
    else if (parsed.when === 'week' && parsed.weekKey === isoWeekKey(todayISO())) setWhen('week')
    else if (parsed.when === 'week') setWhen('nextweek')
    else if (parsed.when === 'anytime' || parsed.when === 'someday' || parsed.when === 'inbox') setWhen('inbox')
  }

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <p className="step-count">Ablegen</p>
        <h2>Was ist da?</h2>
        <p className="lead">Ablegen. Ein Datum setzt du hier oder später im Board.</p>
        <input
          ref={ref}
          className="capture-input"
          placeholder="Anrufen, schreiben, klären…"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit(e.metaKey || e.ctrlKey)
            }
            if (e.key === 'Escape') onClose()
          }}
        />
        <div className="destinations">
          {DEST.map((d) => (
            <button
              key={d.id}
              className={'chip' + (when === d.id ? ' active' : '')}
              onClick={() => setWhen(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
        <TagBar
          embedded
          noneLabel="Ohne"
          selectOnCreate
          value={areaId || ''}
          onChange={(id) => setAreaId(id || null)}
        />
        <div className="row-btns">
          <button className="btn" onClick={() => submit()}>
            Ablegen
          </button>
          <button className="btn ghost" onClick={() => submit(true)}>
            Auf heute
          </button>
        </div>
        <p className="hint">
          Natürlich schreiben: „morgen LLC klären #privat“. Enter legt ab, ⌘Enter auf heute, Esc schließt.
        </p>
      </div>
    </div>,
    document.body,
  )
}
