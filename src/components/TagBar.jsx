import { useState } from 'react'
import { activeTags, addProject, useAlba } from '../store'

export default function TagBar({
  value = '',
  onChange,
  noneLabel = 'Alle',
  allowCreate = true,
  embedded = false,
  selectOnCreate = false,
}) {
  const s = useAlba()
  const tags = activeTags(s)
  const [name, setName] = useState('')

  return (
    <div className={'tag-filter' + (embedded ? ' embedded' : '')}>
      <button
        type="button"
        className={'chip' + (!value ? ' active' : '')}
        onClick={() => onChange('')}
      >
        {noneLabel}
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          type="button"
          className={'chip' + (value === tag.id ? ' active' : '')}
          onClick={() => onChange(value === tag.id ? '' : tag.id)}
        >
          <span className={'pip ' + tag.tone}>
            <i />
            {tag.name}
          </span>
        </button>
      ))}
      {allowCreate && (
        <form
          className="tag-add"
          onSubmit={(e) => {
            e.preventDefault()
            const title = name.trim()
            if (!title) return
            const tag = addProject(title)
            setName('')
            if (tag && selectOnCreate) onChange(tag.id)
          }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="+ Tag"
            aria-label="Neuer Tag"
          />
        </form>
      )}
    </div>
  )
}
