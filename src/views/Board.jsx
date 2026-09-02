import { useState } from 'react'
import {
  activeTags,
  addProject,
  areaById,
  capture,
  dropTask,
  inboxTasks,
  openIdea,
  plannedTimeline,
  scheduleTask,
  setTaskTag,
  toggleTask,
  updateTask,
  useAlba,
} from '../store'
import { addDays, dowShort, isoWeekKey, todayISO } from '../lib/dates'
import TrashBtn from '../components/Trash'
import TagBar from '../components/TagBar'
import WorkStick from '../components/WorkStick'
import DateMenu, { CalIcon, pinLabel } from '../components/DateMenu'

function Check({ on, onToggle, label }) {
  return (
    <button
      className={'check' + (on ? ' on' : '')}
      onClick={(e) => {
        e.stopPropagation()
        onToggle()
      }}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M5 12.5l5 5L19 7" />
      </svg>
    </button>
  )
}

function TagMenu({ value, onPick }) {
  const s = useAlba()
  const tags = activeTags(s)
  const [name, setName] = useState('')
  return (
    <div className="cal-menu">
      <button type="button" className={!value ? 'active' : ''} onClick={() => onPick('')}>
        Ohne Tag
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={value === tag.id ? 'active' : ''}
          onClick={() => onPick(tag.id)}
        >
          <span className={'pip ' + tag.tone}>
            <i />
            {tag.name}
          </span>
        </button>
      ))}
      <form
        className="inline-add tight"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          const tag = addProject(name.trim())
          setName('')
          if (tag) onPick(tag.id)
        }}
      >
        <span className="plus">+</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Neuer Tag" />
      </form>
    </div>
  )
}

function TodoRow({ task }) {
  const s = useAlba()
  const area = areaById(s, task.areaId)
  const today = todayISO()
  const current = isoWeekKey(today)
  const overdue =
    task.status === 'open' &&
    ((task.date && task.date < today) || (!task.date && task.weekKey && task.weekKey < current))
  const [menu, setMenu] = useState(null)
  const [notes, setNotes] = useState(false)
  const label = pinLabel(task, today)

  return (
    <article
      className={
        'todo-row' + (task.status === 'done' ? ' is-done' : '') + (overdue ? ' overdue' : '')
      }
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
    >
      <div className="todo-main">
        <Check on={task.status === 'done'} onToggle={() => toggleTask(task.id)} label={task.title} />
        <div className="todo-body">
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
            aria-label="To-do"
          />
          <div className="compact-meta">
            {area && (
              <span className={'pip ' + area.tone}>
                <i />
                {area.name}
              </span>
            )}
            {task.date && !overdue && task.date !== today && task.date !== addDays(today, 1) && (
              <span className="quiet">{dowShort(task.date)}</span>
            )}
            {overdue && <span className="quiet">{task.date ? dowShort(task.date) : 'Woche'}</span>}
            {task.ideaId && (
              <button
                type="button"
                className="pip"
                onClick={(e) => {
                  e.stopPropagation()
                  openIdea(task.ideaId)
                }}
              >
                Idee
              </button>
            )}
            {task.notes && !notes && <span className="quiet">Notiz</span>}
          </div>
        </div>
        <div className="todo-tools">
          <button
            type="button"
            className={'cal-btn' + (task.areaId ? ' on' : '') + (menu === 'tag' ? ' open' : '')}
            onClick={() => setMenu((m) => (m === 'tag' ? null : 'tag'))}
            aria-label="Tag"
            title="Tag"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12l8-8h8v8l-8 8-8-8z" />
              <circle cx="16.5" cy="7.5" r="1.2" />
            </svg>
          </button>
          <button
            type="button"
            className={
              'cal-btn' +
              (task.date || task.weekKey ? ' on has-label' : '') +
              (menu === 'date' ? ' open' : '')
            }
            onClick={() => setMenu((m) => (m === 'date' ? null : 'date'))}
            aria-label="Datum"
            title="Datum"
          >
            <CalIcon />
            {label ? <span>{label}</span> : null}
          </button>
          <button
            type="button"
            className={'cal-btn' + (notes || task.notes ? ' on' : '')}
            onClick={() => setNotes((v) => !v)}
            aria-label="Notiz"
            title="Notiz"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M5 5h14v14H5z" />
              <path d="M8 9h8M8 12h8M8 15h5" />
            </svg>
          </button>
          <TrashBtn onClick={() => dropTask(task.id)} />
        </div>
      </div>
      {menu === 'date' && (
        <DateMenu
          date={task.date}
          weekKey={task.weekKey}
          onPick={(spec) => {
            scheduleTask(task.id, spec)
            setMenu(null)
          }}
        />
      )}
      {menu === 'tag' && (
        <TagMenu
          value={task.areaId}
          onPick={(id) => {
            setTaskTag(task.id, id || null)
            setMenu(null)
          }}
        />
      )}
      {notes && (
        <textarea
          className="todo-note"
          rows={3}
          placeholder="Was genau."
          value={task.notes || ''}
          onChange={(e) => updateTask(task.id, { notes: e.target.value })}
        />
      )}
    </article>
  )
}

function AddTodo({ placeholder, spec, areaId, onAdded }) {
  const [text, setText] = useState('')
  return (
    <form
      className="inline-add tight"
      onSubmit={(e) => {
        e.preventDefault()
        if (!text.trim()) return
        const task = capture(text, {
          when: spec?.date ? 'today' : spec?.weekKey ? 'week' : 'inbox',
          date: spec?.date,
          weekKey: spec?.weekKey,
          areaId: areaId || undefined,
        })
        if (task) {
          setText('')
          onAdded?.()
        }
      }}
    >
      <span className="plus">+</span>
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
    </form>
  )
}

function laneDrop(e, spec) {
  e.preventDefault()
  const id = e.dataTransfer.getData('text/plain')
  if (!id) return
  scheduleTask(id, spec)
}

export default function Board() {
  const s = useAlba()
  const today = todayISO()
  const inbox = inboxTasks(s)
  const groups = plannedTimeline(s, today)
  const [over, setOver] = useState(null)
  const [filter, setFilter] = useState('')

  const visibleInbox = filter ? inbox.filter((t) => t.areaId === filter) : inbox
  const visibleGroups = groups
    .map((g) => ({
      ...g,
      tasks: filter ? g.tasks.filter((t) => t.areaId === filter) : g.tasks,
    }))
    .filter((g) => g.always || g.tasks.length)

  const plannedCount = groups.reduce((n, g) => n + g.tasks.length, 0)

  return (
    <div className="board-wrap">
      <div className="dateblock">
        <p className="dow">Arbeit</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(40px, 6vw, 56px)' }}>
          To-do
        </h1>
        <p className="month">Neu ablegen, dann ein Datum geben.</p>
      </div>

      <WorkStick>
      <TagBar embedded value={filter} onChange={setFilter} />

      <div className="board lanes-two">
        <section
          className={'board-col' + (over === 'inbox' ? ' over' : '')}
          onDragOver={(e) => {
            e.preventDefault()
            setOver('inbox')
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            setOver(null)
            laneDrop(e, null)
          }}
        >
          <div className="section-head">
            <span className="section-label">Neu</span>
            <span className="quiet">{visibleInbox.length}</span>
          </div>
          <p className="quiet" style={{ marginTop: -6 }}>
            Noch kein Datum
          </p>
          {visibleInbox.length === 0 && (
            <p className="empty">Leer. Alles hat einen Tag — oder nichts liegt an.</p>
          )}
          {visibleInbox.map((t) => (
            <TodoRow key={t.id} task={t} />
          ))}
          <AddTodo placeholder="To-do ablegen" areaId={filter} />
        </section>

        <section
          className={'board-col' + (over === 'planned' ? ' over' : '')}
          onDragOver={(e) => {
            e.preventDefault()
            setOver('planned')
          }}
          onDragLeave={() => setOver(null)}
          onDrop={(e) => {
            setOver(null)
            laneDrop(e, { date: today })
          }}
        >
          <div className="section-head">
            <span className="section-label">Geplant</span>
            <span className="quiet">{plannedCount}</span>
          </div>
          <p className="quiet" style={{ marginTop: -6 }}>
            Timeline
          </p>
          {visibleGroups.map((g) => (
            <div
              key={g.key}
              className={'date-block' + (over === g.key ? ' over' : '')}
              onDragOver={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setOver(g.key)
              }}
              onDrop={(e) => {
                e.stopPropagation()
                setOver(null)
                laneDrop(e, g.spec)
              }}
            >
              <p className="group-label" style={{ marginTop: 14 }}>
                {g.label}
              </p>
              {g.tasks.length === 0 && <p className="empty">Nichts.</p>}
              {g.tasks.map((t) => (
                <TodoRow key={t.id} task={t} />
              ))}
              {g.kind !== 'overdue' && (
                <AddTodo
                  placeholder={g.kind === 'week' ? `Für ${g.label.toLowerCase()}` : `Für ${g.label.toLowerCase()}`}
                  spec={g.spec}
                  areaId={filter}
                />
              )}
            </div>
          ))}
        </section>
      </div>
      </WorkStick>
    </div>
  )
}
