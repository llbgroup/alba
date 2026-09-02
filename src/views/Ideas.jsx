import { useEffect, useMemo, useState } from 'react'
import { addIdea, areaById, deleteIdea, ideaList, useAlba } from '../store'
import { formatShort } from '../lib/dates'
import { htmlToPreview } from '../lib/noteHtml'
import TagBar from '../components/TagBar'
import NoteEditor from '../components/NoteEditor'
import WorkStick from '../components/WorkStick'

const LAST_KEY = 'alba.idea.v1'

function lastIdeaId() {
  try {
    return localStorage.getItem(LAST_KEY) || ''
  } catch {
    return ''
  }
}

function preview(body) {
  return htmlToPreview(body)
}

function stamp(iso) {
  if (!iso) return ''
  const day = iso.slice(0, 10)
  return formatShort(day)
}

export default function Ideas() {
  const s = useAlba()
  const ideas = ideaList(s)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [openId, setOpenId] = useState(lastIdeaId)
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ideas.filter((i) => {
      if (filter && i.areaId !== filter) return false
      if (!q) return true
      const hay = [i.title, i.body, areaById(s, i.areaId)?.name].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [ideas, query, filter, s])

  const current = ideas.find((i) => i.id === openId) || null

  useEffect(() => {
    try {
      if (openId) localStorage.setItem(LAST_KEY, openId)
      else localStorage.removeItem(LAST_KEY)
    } catch {
      /* ignore */
    }
  }, [openId])

  function create() {
    const idea = addIdea({ title: '', body: '', areaId: filter || null })
    setOpenId(idea.id)
    setQuery('')
  }

  function remove() {
    if (!current) return
    const idx = shown.findIndex((i) => i.id === current.id)
    deleteIdea(current.id)
    const next = shown[idx + 1] || shown[idx - 1] || null
    setOpenId(next && next.id !== current.id ? next.id : '')
  }

  return (
    <div className="ideas-wrap">
      <div className="dateblock">
        <p className="dow">Denken</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(40px, 6vw, 56px)' }}>
          Ideen
        </h1>
        <p className="month">Schreiben. Die Übersicht bleibt links.</p>
      </div>

      <WorkStick>
      <TagBar embedded value={filter} onChange={setFilter} />

      <div className={'ideas' + (current ? ' has-open' : '')}>
        <section className="ideas-list">
          <div className="ideas-list-head">
            {searchOpen || query ? (
              <input
                className="ideas-search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQuery('')
                    setSearchOpen(false)
                  }
                }}
                placeholder="Suchen…"
                aria-label="Ideen suchen"
              />
            ) : (
              <span className="section-label">Notizen</span>
            )}
            <div className="ideas-list-tools">
              <button
                type="button"
                className={'note-icon' + (searchOpen || query ? ' open' : '')}
                onClick={() => {
                  if (searchOpen || query) {
                    setQuery('')
                    setSearchOpen(false)
                  } else setSearchOpen(true)
                }}
                aria-label={searchOpen || query ? 'Suche schließen' : 'Suchen'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4 4" />
                </svg>
              </button>
              <button className="btn" onClick={create}>
                Neu
              </button>
            </div>
          </div>
          {shown.length === 0 && (
            <p className="empty">Noch keine Idee. Neu, dann schreiben.</p>
          )}
          <div className="idea-rows" role="listbox" aria-label="Ideen">
            {shown.map((idea) => {
              const area = areaById(s, idea.areaId)
              const on = idea.id === openId
              return (
                <button
                  key={idea.id}
                  type="button"
                  role="option"
                  aria-selected={on}
                  className={'idea-row' + (on ? ' on' : '')}
                  onClick={() => setOpenId(idea.id)}
                >
                  <span className="idea-row-title">{idea.title.trim() || 'Neue Idee'}</span>
                  <span className="idea-row-preview">{preview(idea.body) || 'Leer'}</span>
                  <span className="idea-row-meta">
                    {area && (
                      <span className={'pip ' + area.tone}>
                        <i />
                        {area.name}
                      </span>
                    )}
                    <span className="quiet">{stamp(idea.updatedAt || idea.createdAt)}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="ideas-editor">
          {current ? (
            <NoteEditor idea={current} onDelete={remove} />
          ) : (
            <div className="ideas-doc-card ideas-empty">
              <p className="empty">Wähle eine Idee links, oder schreib eine neue.</p>
              <button className="btn" onClick={create}>
                Neue Idee
              </button>
            </div>
          )}
        </section>
      </div>
      </WorkStick>
    </div>
  )
}
