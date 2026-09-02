import { resolveAllStale, resolveStale } from '../store'
import { formatShort } from '../lib/dates'
import TrashBtn from './Trash'

export default function CarryOver({ items, onClose }) {
  if (!items?.length) return null
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <p className="step-count">Gestern ist nicht heute</p>
        <h2>Was mitkommt</h2>
        <p className="lead">
          Pläne dürfen sich ändern. Mitnehmen, verschieben oder loslassen — nichts davon ist ein Fehler.
        </p>
        {items.map((t) => (
          <div className="stale-item" key={t.id}>
            <div>
              <p>{t.title}</p>
              <span className="quiet">{t.date ? formatShort(t.date) : ''}</span>
            </div>
            <div className="task-actions" style={{ opacity: 1 }}>
              <button className="chip" onClick={() => resolveStale(t.id, 'today')}>
                Heute
              </button>
              <button className="chip" onClick={() => resolveStale(t.id, 'tomorrow')}>
                Morgen
              </button>
              <button className="chip" onClick={() => resolveStale(t.id, 'anytime')}>
                Später
              </button>
              <TrashBtn onClick={() => resolveStale(t.id, 'drop')} />
            </div>
          </div>
        ))}
        <div className="row-btns">
          <button className="btn ghost" onClick={() => resolveAllStale('tomorrow')}>
            Alles auf morgen
          </button>
          <button className="btn" onClick={onClose}>
            Fertig
          </button>
        </div>
      </div>
    </div>
  )
}
