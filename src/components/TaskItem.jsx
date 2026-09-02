import { useState } from 'react'
import {
  completeTask,
  reopenTask,
  dropTask,
  deleteTask,
  pullToToday,
  sendTo,
  updateTask,
  areaById,
  useAlba,
} from '../store'
import { addDays, todayISO } from '../lib/dates'
import TrashBtn from './Trash'

function Check({ on, onToggle }) {
  return (
    <button
      className={'check' + (on ? ' on' : '')}
      onClick={onToggle}
      aria-label={on ? 'Wieder öffnen' : 'Erledigt'}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M5 12.5l5 5L19 7" />
      </svg>
    </button>
  )
}

export default function TaskItem({
  task,
  index,
  overflow = false,
  showMove = true,
  allowDelete = false,
  compact = false,
}) {
  const s = useAlba()
  const area = areaById(s, task.areaId)
  const [openIf, setOpenIf] = useState(false)

  return (
    <div className={'task' + (task.status === 'done' ? ' done' : '') + (overflow ? ' overflow' : '')}>
      <Check
        on={task.status === 'done'}
        onToggle={() => (task.status === 'done' ? reopenTask(task.id) : completeTask(task.id))}
      />
      <div>
        <div style={{ display: 'flex', gap: 10 }}>
          {typeof index === 'number' && <span className="task-index">{index}</span>}
          <textarea
            className="title-input"
            rows={1}
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
            aria-label="Aufgabe"
          />
        </div>
        <div className="task-meta">
          {area && (
            <span className={'pip ' + area.tone}>
              <i />
              {area.name}
            </span>
          )}
          {task.ifThen && !openIf && <span className="ifthen">{task.ifThen}</span>}
        </div>
        {openIf && (
          <input
            className="ghost-input"
            style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
            placeholder="Wenn X, dann Y"
            value={task.ifThen || ''}
            onChange={(e) => updateTask(task.id, { ifThen: e.target.value })}
          />
        )}
      </div>
      {showMove && task.status !== 'done' && (
        <div className="task-actions">
          {compact ? (
            <>
              {task.date !== todayISO() && (
                <button className="chip" onClick={() => pullToToday(task.id)}>
                  Heute
                </button>
              )}
              {task.date !== addDays(todayISO(), 1) && (
                <button className="chip" onClick={() => sendTo(task.id, 'tomorrow')}>
                  Morgen
                </button>
              )}
              <TrashBtn onClick={() => dropTask(task.id)} />
            </>
          ) : (
            <>
              {task.date !== todayISO() && (
                <button className="chip" onClick={() => pullToToday(task.id)}>
                  Heute
                </button>
              )}
              <button className="chip" onClick={() => sendTo(task.id, 'inbox')}>
                Neu
              </button>
              <button className="chip" onClick={() => setOpenIf((v) => !v)}>
                {openIf ? 'Plan zu' : 'Plan'}
              </button>
              <TrashBtn onClick={() => (allowDelete ? deleteTask(task.id) : dropTask(task.id))} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
