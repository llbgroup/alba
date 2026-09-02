import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { compressImage } from '../lib/image'
import { bodyToHtml, serializeNoteHtml } from '../lib/noteHtml'
import { rewriteText } from '../lib/rewrite'
import { createRecognition, SpeechEngine } from '../lib/speech'
import {
  addIdeaTask,
  areaById,
  linkTaskToIdea,
  scheduleTask,
  searchOpenTasks,
  showToast,
  syncIdeaTasksFromHtml,
  toggleTask,
  updateIdea,
  updateTask,
  useAlba,
} from '../store'
import { todayISO } from '../lib/dates'
import DateMenu, { pinLabel } from './DateMenu'
import TagBar from './TagBar'
import TrashBtn from './Trash'

const CHECK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12.5l5 5L19 7"/></svg>'

const AI_ACTIONS = [
  { id: 'fix', label: 'Korrigieren' },
  { id: 'clear', label: 'Optimieren' },
  { id: 'expand', label: 'Ausformulieren' },
  { id: 'short', label: 'Kürzer' },
]

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

function todoMarkup(task, today) {
  const label = pinLabel(task, today)
  return (
    `<button type="button" class="check${task.status === 'done' ? ' on' : ''}" aria-label="Erledigt">${CHECK_SVG}</button>` +
    `<span class="note-todo-title" contenteditable="true">${escapeText(task.title)}</span>` +
    `<button type="button" class="cal-btn${task.date || task.weekKey ? ' on has-label' : ''}" aria-label="Datum">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3.5v4M16 3.5v4M3.5 10h17"/></svg>` +
    (label ? `<span>${escapeText(label)}</span>` : '') +
    `</button>`
  )
}

function placeCaretAfter(node) {
  const sel = window.getSelection()
  if (!sel || !node?.parentNode) return
  const range = document.createRange()
  range.setStartAfter(node)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

function wrapRange(range, className) {
  const span = document.createElement('span')
  span.className = className
  span.setAttribute('contenteditable', 'false')
  try {
    range.surroundContents(span)
  } catch {
    span.appendChild(range.extractContents())
    range.insertNode(span)
  }
  return span
}

function textToHtml(text) {
  return escapeText(text).replace(/\n/g, '<br>')
}

export default function NoteEditor({ idea, onDelete }) {
  const s = useAlba()
  const ref = useRef(null)
  const fileRef = useRef(null)
  const recRef = useRef(null)
  const keepRef = useRef(false)
  const listeningRef = useRef(false)
  const aiRangeRef = useRef(null)
  const [marks, setMarks] = useState({ bold: false, ul: false, h2: false, h3: false, mark: false, link: false })
  const [tagOpen, setTagOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [todoOpen, setTodoOpen] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')
  const [todoDraft, setTodoDraft] = useState('')
  const urlRangeRef = useRef(null)
  const todoRangeRef = useRef(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiCustom, setAiCustom] = useState('')
  const [listening, setListening] = useState(false)
  const [cal, setCal] = useState(null)
  const today = todayISO()
  const area = areaById(s, idea.areaId)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = bodyToHtml(idea.body)
    hydrate()
    return () => stopMic()
  }, [idea.id])

  useEffect(() => {
    hydrate()
  }, [s.tasks, idea.id])

  function hydrate() {
    const el = ref.current
    if (!el || el.querySelector('.note-todo-title:focus')) return
    const byId = new Map((s.tasks || []).map((t) => [t.id, t]))
    el.querySelectorAll('.note-todo').forEach((node) => {
      const task = byId.get(node.getAttribute('data-task-id'))
      node.setAttribute('contenteditable', 'false')
      node.classList.toggle('is-done', task?.status === 'done')
      if (!task || task.status === 'dropped') {
        node.innerHTML = '<span class="quiet">Gelöst</span>'
        return
      }
      const html = todoMarkup(task, today)
      if (node.innerHTML !== html) node.innerHTML = html
    })
  }

  function persist(e, { force } = {}) {
    if (e?.target?.closest?.('.note-todo-title')) return
    if (listeningRef.current && !force) return
    const el = ref.current
    if (!el) return
    const html = serializeNoteHtml(el)
    updateIdea(idea.id, { body: html }, { touch: false })
    syncIdeaTasksFromHtml(idea.id, html)
    readMarks()
  }

  function readMarks() {
    try {
      const block = (document.queryCommandValue('formatBlock') || '').toLowerCase()
      const node = window.getSelection()?.anchorNode
      const el = node?.nodeType === 1 ? node : node?.parentElement
      setMarks({
        bold: document.queryCommandState('bold'),
        ul: document.queryCommandState('insertUnorderedList'),
        h2: block === 'h2',
        h3: block === 'h3',
        mark: Boolean(el?.closest?.('mark')),
        link: Boolean(el?.closest?.('a')),
      })
    } catch {
      /* ignore */
    }
  }

  function run(command, value) {
    ref.current?.focus()
    document.execCommand(command, false, value)
    persist()
  }

  function heading(tag) {
    const current = (document.queryCommandValue('formatBlock') || '').toLowerCase()
    run('formatBlock', current === tag ? 'p' : tag)
  }

  function toggleHighlight() {
    ref.current?.focus()
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    let node = range.commonAncestorContainer
    if (node.nodeType === 3) node = node.parentElement
    const existing = node?.closest?.('mark')
    if (existing && ref.current.contains(existing)) {
      const parent = existing.parentNode
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing)
      parent.removeChild(existing)
      parent.normalize()
      persist()
      return
    }
    const mark = document.createElement('mark')
    mark.className = 'note-mark'
    mark.appendChild(range.extractContents())
    range.insertNode(mark)
    sel.removeAllRanges()
    const next = document.createRange()
    next.selectNodeContents(mark)
    sel.addRange(next)
    persist()
  }

  function saveRange(store) {
    const sel = window.getSelection()
    if (sel?.rangeCount && ref.current?.contains(sel.anchorNode)) {
      store.current = sel.getRangeAt(0).cloneRange()
    } else store.current = null
  }

  function restoreRange(store) {
    const range = store.current
    const sel = window.getSelection()
    if (!range || !sel || !ref.current) return
    ref.current.focus()
    sel.removeAllRanges()
    try {
      sel.addRange(range)
    } catch {
      /* ignore */
    }
  }

  function insertTodo(task) {
    if (!task) return
    restoreRange(todoRangeRef)
    ref.current?.focus()
    document.execCommand(
      'insertHTML',
      false,
      `<div class="note-todo" data-task-id="${task.id}"></div><p><br></p>`,
    )
    persist()
    hydrate()
  }

  function openTodo() {
    saveRange(todoRangeRef)
    const sel = window.getSelection()?.toString().trim() || ''
    setTodoDraft(sel)
    setTodoOpen((v) => !v)
    setLinkOpen(false)
    setTagOpen(false)
    setAiOpen(false)
  }

  function createTodo(title) {
    const task = addIdeaTask(idea.id, title || 'To-do')
    insertTodo(task)
    setTodoOpen(false)
    setTodoDraft('')
  }

  function pickTodo(task) {
    linkTaskToIdea(task.id, idea.id)
    insertTodo(task)
    setTodoOpen(false)
    setTodoDraft('')
  }

  function currentLink() {
    const sel = window.getSelection()
    const node = sel?.anchorNode
    const host = node?.nodeType === 1 ? node : node?.parentElement
    const a = host?.closest?.('a')
    if (a && ref.current?.contains(a)) return a
    return null
  }

  function normalizeUrl(raw) {
    let u = (raw || '').trim()
    if (!u) return ''
    if (/^mailto:/i.test(u)) return u
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u
    if (!/^https?:\/\//i.test(u) && !/^mailto:/i.test(u)) return ''
    return u
  }

  function openLink() {
    saveRange(urlRangeRef)
    const existing = currentLink()
    const selected = window.getSelection()?.toString().trim() || ''
    const prefill = existing?.getAttribute('href') || (/^(https?:\/\/|mailto:)/i.test(selected) ? selected : selected && /^[\w.-]+\.[a-z]{2,}/i.test(selected) ? selected : '')
    setUrlDraft(prefill)
    setLinkOpen((v) => !v)
    setTodoOpen(false)
    setTagOpen(false)
    setAiOpen(false)
  }

  function applyLink(raw) {
    const href = normalizeUrl(raw)
    if (!href) {
      showToast('Eine gültige Adresse braucht http oder https.')
      return
    }
    restoreRange(urlRangeRef)
    const existing = currentLink()
    if (existing) {
      existing.setAttribute('href', href)
      persist()
      setLinkOpen(false)
      return
    }
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      document.execCommand('createLink', false, href)
      ref.current?.querySelectorAll('a[href]').forEach((a) => {
        const h = a.getAttribute('href') || ''
        if (/^https?:\/\//i.test(h) || /^mailto:/i.test(h)) {
          a.className = 'note-link'
          a.setAttribute('target', '_blank')
          a.setAttribute('rel', 'noopener noreferrer')
        }
      })
    } else {
      const label = href.replace(/^https?:\/\//i, '').replace(/\/$/, '')
      document.execCommand(
        'insertHTML',
        false,
        `<a class="note-link" href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">${escapeText(label)}</a>`,
      )
    }
    persist()
    setLinkOpen(false)
    setUrlDraft('')
  }

  function removeLink() {
    restoreRange(urlRangeRef)
    const existing = currentLink()
    if (existing) {
      const parent = existing.parentNode
      while (existing.firstChild) parent.insertBefore(existing.firstChild, existing)
      parent.removeChild(existing)
      parent.normalize()
    } else {
      document.execCommand('unlink')
    }
    persist()
    setLinkOpen(false)
    setUrlDraft('')
  }

  async function onImage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const src = await compressImage(file)
      ref.current?.focus()
      document.execCommand('insertHTML', false, `<img src="${src}" alt="">`)
      persist()
    } catch {
      showToast('Bild unlesbar.')
    }
  }

  function rangeForDictation() {
    const root = ref.current
    const range = document.createRange()
    const sel = window.getSelection()
    if (sel?.rangeCount && root.contains(sel.anchorNode)) {
      const node = sel.anchorNode
      const host = node.nodeType === 1 ? node : node.parentElement
      const todo = host?.closest?.('.note-todo')
      if (todo && root.contains(todo)) {
        range.setStartAfter(todo)
        range.collapse(true)
        return range
      }
      const current = sel.getRangeAt(0)
      current.collapse(false)
      return current
    }
    range.selectNodeContents(root)
    range.collapse(false)
    return range
  }

  function ensureDictationSpan() {
    const root = ref.current
    if (!root) return null
    let span = root.querySelector('.note-dictation')
    if (span) return span
    span = document.createElement('span')
    span.className = 'note-dictation'
    span.setAttribute('contenteditable', 'false')
    const range = rangeForDictation()
    range.insertNode(span)
    placeCaretAfter(span)
    return span
  }

  function commitFinal(chunk) {
    const span = ensureDictationSpan()
    if (!span) return
    const t = (chunk || '').replace(/\s+/g, ' ').trim()
    if (!t) return
    span.parentNode.insertBefore(document.createTextNode(t + ' '), span)
    placeCaretAfter(span)
    persist(null, { force: true })
  }

  function setInterim(text) {
    const span = ensureDictationSpan()
    if (!span) return
    span.textContent = (text || '').replace(/\s+/g, ' ')
    placeCaretAfter(span)
  }

  function settleDictation() {
    const span = ref.current?.querySelector('.note-dictation')
    if (!span) return
    const t = (span.textContent || '').replace(/\s+/g, ' ').trim()
    if (t) span.replaceWith(document.createTextNode(t + ' '))
    else span.remove()
    persist(null, { force: true })
  }

  function haltRecognition() {
    keepRef.current = false
    listeningRef.current = false
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    recRef.current = null
    setListening(false)
  }

  function stopMic() {
    haltRecognition()
    settleDictation()
  }

  function startMic() {
    haltRecognition()
    settleDictation()
    keepRef.current = true
    listeningRef.current = true
    const rec = createRecognition({
      onFinal: (chunk) => {
        if (recRef.current !== rec) return
        commitFinal(chunk)
      },
      onInterim: (t) => {
        if (recRef.current !== rec) return
        setInterim(t)
      },
      onError: () => {
        if (recRef.current !== rec) return
        keepRef.current = false
        listeningRef.current = false
        setListening(false)
        settleDictation()
      },
      onEnd: () => {
        if (recRef.current !== rec) return
        if (keepRef.current) {
          try {
            rec.start()
          } catch {
            keepRef.current = false
            listeningRef.current = false
            setListening(false)
            settleDictation()
          }
        } else {
          listeningRef.current = false
          setListening(false)
        }
      },
    })
    if (!rec) {
      keepRef.current = false
      listeningRef.current = false
      showToast('Spracheingabe braucht Safari oder Chrome.')
      return
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
      ref.current?.focus()
      ensureDictationSpan()
    } catch {
      keepRef.current = false
      listeningRef.current = false
      showToast('Mikrofon nicht verfügbar.')
    }
  }

  function openAi() {
    const sel = window.getSelection()
    const root = ref.current
    if (sel?.rangeCount && root?.contains(sel.anchorNode) && !sel.isCollapsed && sel.toString().trim()) {
      aiRangeRef.current = sel.getRangeAt(0).cloneRange()
    } else {
      aiRangeRef.current = null
    }
    setAiOpen((v) => !v)
    setTagOpen(false)
    setLinkOpen(false)
    setTodoOpen(false)
    setAiError('')
  }

  function captureTarget() {
    const root = ref.current
    if (!root) return null
    const saved = aiRangeRef.current
    if (saved && root.contains(saved.commonAncestorContainer) && saved.toString().trim()) {
      return { mode: 'range', range: saved, text: saved.toString() }
    }
    const sel = window.getSelection()
    if (sel?.rangeCount && root.contains(sel.anchorNode) && !sel.isCollapsed && sel.toString().trim()) {
      return { mode: 'range', range: sel.getRangeAt(0), text: sel.toString() }
    }
    const node = sel?.anchorNode
    const host = node?.nodeType === 1 ? node : node?.parentElement
    const block = host?.closest?.('p, h2, h3, li')
    if (block && root.contains(block) && !block.closest('.note-todo') && block.innerText.trim()) {
      return { mode: 'block', block, text: block.innerText }
    }
    const clone = root.cloneNode(true)
    clone.querySelectorAll('.note-todo, img, .note-dictation').forEach((n) => n.remove())
    const text = (clone.innerText || '').replace(/\n{3,}/g, '\n\n').trim()
    if (!text) return null
    return { mode: 'doc', text }
  }

  function applyRewrite(target, out) {
    const root = ref.current
    if (!root) return
    if (target.mode === 'range' && target.span?.parentNode) {
      const html = textToHtml(out)
      const tmp = document.createElement('span')
      tmp.innerHTML = html
      const parent = target.span.parentNode
      while (tmp.firstChild) parent.insertBefore(tmp.firstChild, target.span)
      parent.removeChild(target.span)
      parent.normalize()
      return
    }
    if (target.mode === 'block' && target.block?.parentNode) {
      if (target.span?.parentNode) {
        target.span.outerHTML = textToHtml(out)
      } else {
        target.block.innerHTML = textToHtml(out)
      }
      return
    }
    const keep = [...root.querySelectorAll('.note-todo, img')]
    keep.forEach((n) => n.remove())
    const paras = out
      .split(/\n\n+/)
      .map((p) => `<p>${textToHtml(p.trim())}</p>`)
      .join('')
    root.innerHTML = paras || '<p><br></p>'
    keep.forEach((n) => root.appendChild(n))
  }

  async function runAi(action, custom) {
    if (aiBusy) return
    const target = captureTarget()
    if (!target) {
      setAiError('Nichts zum Umschreiben. Markieren oder in einen Absatz klicken.')
      return
    }
    if (target.mode === 'range') {
      const probe = target.range.cloneContents()
      if (probe.querySelector?.('.note-todo, img')) {
        setAiError('To-dos und Bilder nicht mitmarkieren.')
        return
      }
    }
    setAiBusy(true)
    setAiError('')
    if (target.mode === 'range') {
      target.span = wrapRange(target.range, 'note-ai-target')
      target.span.classList.add('is-busy')
    } else if (target.mode === 'block') {
      const range = document.createRange()
      range.selectNodeContents(target.block)
      target.span = wrapRange(range, 'note-ai-target')
      target.span.classList.add('is-busy')
    } else {
      rootBusy(true)
    }
    try {
      const out = await rewriteText({ text: target.text, action, custom })
      if (!out) throw new Error('Leere Antwort.')
      applyRewrite(target, out)
      persist()
      hydrate()
      setAiOpen(false)
      setAiCustom('')
      aiRangeRef.current = null
    } catch (err) {
      target.span?.classList.remove('is-busy')
      if (target.span?.parentNode) {
        const parent = target.span.parentNode
        while (target.span.firstChild) parent.insertBefore(target.span.firstChild, target.span)
        parent.removeChild(target.span)
      }
      const msg = err?.status === 501 ? 'Unter Einstellungen den xAI-Schlüssel eintragen.' : err.message || 'Umschreiben fehlgeschlagen.'
      setAiError(msg)
      showToast(msg)
    } finally {
      rootBusy(false)
      setAiBusy(false)
    }
  }

  function rootBusy(on) {
    ref.current?.classList.toggle('is-rewriting', on)
  }

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      run('bold')
    }
  }

  function onSurfaceClick(e) {
    const a = e.target.closest?.('a.note-link, a[href]')
    if (a && ref.current?.contains(a) && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      window.open(a.getAttribute('href'), '_blank', 'noopener,noreferrer')
      return
    }
    const block = e.target.closest('.note-todo')
    if (!block) return
    const id = block.getAttribute('data-task-id')
    if (!id) return
    if (e.target.closest('.check')) {
      e.preventDefault()
      toggleTask(id)
      return
    }
    if (e.target.closest('.cal-btn')) {
      e.preventDefault()
      const r = e.target.closest('.cal-btn').getBoundingClientRect()
      setCal({ id, top: r.bottom + 6, left: r.left })
    }
  }

  function onTitleBlur(e) {
    const title = e.target.closest('.note-todo-title')
    if (!title) return
    const id = title.closest('.note-todo')?.getAttribute('data-task-id')
    if (id) updateTask(id, { title: title.textContent.trim() || 'To-do' })
  }

  const html = idea.body || ''
  const empty = !(html || '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/g, '')
    .replace(/<div class="note-todo"[^>]*><\/div>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  return (
    <div className="note-doc">
      <div className="ideas-doc-chrome">
      <header className="ideas-doc-bar">
        <div className="note-tools" role="toolbar" aria-label="Text">
          <button
            type="button"
            className={'note-tool' + (marks.h2 ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => heading('h2')}
          >
            H2
          </button>
          <button
            type="button"
            className={'note-tool' + (marks.h3 ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => heading('h3')}
          >
            H3
          </button>
          <button
            type="button"
            className={'note-tool' + (marks.bold ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run('bold')}
            aria-label="Fett"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={'note-tool' + (marks.mark ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleHighlight}
            aria-label="Textmarker"
            title="Textmarker"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M4 20h7l9.2-9.2a2.3 2.3 0 0 0 0-3.2l-3.8-3.8a2.3 2.3 0 0 0-3.2 0L4 13v7z" />
              <path d="M12.5 6.5l5 5" />
            </svg>
          </button>
          <button
            type="button"
            className={'note-tool' + (marks.ul ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run('insertUnorderedList')}
            aria-label="Liste"
          >
            •
          </button>
          <button
            type="button"
            className={'note-tool' + (todoOpen ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openTodo}
            aria-label="To-do einfügen"
            title="To-do einfügen oder bestehendes suchen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="8" />
              <path d="M8.2 12.3l2.4 2.4 5.2-5.4" />
            </svg>
          </button>
          <button
            type="button"
            className={'note-tool' + (linkOpen || marks.link ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLink}
            aria-label="Link"
            title="Weblink einfügen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M10 13a5 5 0 0 0 7.1.1l1.8-1.8a5 5 0 0 0-7.1-7.1L10.6 5.5" />
              <path d="M14 11a5 5 0 0 0-7.1-.1L5.1 12.7a5 5 0 0 0 7.1 7.1l1.2-1.2" />
            </svg>
          </button>
          <button
            type="button"
            className="note-tool"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            aria-label="Bild"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
              <circle cx="8.5" cy="10" r="1.3" />
              <path d="M3.8 16.5l5.2-4.2 3.2 2.6 3-2.4 5.2 4" />
            </svg>
          </button>
          <button
            type="button"
            className={'note-tool' + (aiOpen || aiBusy ? ' on' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={openAi}
            aria-label="Text mit AI"
            title="Korrigieren, optimieren, ausformulieren"
            disabled={aiBusy}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M12 3.5l1.2 6.3L19.5 12l-6.3 2.2L12 20.5l-1.2-6.3L4.5 12l6.3-2.2L12 3.5z" />
            </svg>
          </button>
          <button
            type="button"
            className={'note-tool' + (listening ? ' on live' : '')}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => (listening ? stopMic() : startMic())}
            aria-label={listening ? 'Aufnahme stoppen' : 'Einsprechen'}
            disabled={!SpeechEngine()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />
        </div>
        <div className="ideas-doc-end">
          {area && (
            <span className={'pip ' + area.tone}>
              <i />
              {area.name}
            </span>
          )}
          <button
            type="button"
            className={'note-icon' + (tagOpen ? ' open' : '')}
            onClick={() => {
              setTagOpen((v) => !v)
              setLinkOpen(false)
              setTodoOpen(false)
              setAiOpen(false)
            }}
            aria-label={area ? `Tag: ${area.name}` : 'Tag'}
            title="Tag"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 12l8-8h8v8l-8 8-8-8z" />
              <circle cx="16.5" cy="7.5" r="1.2" />
            </svg>
          </button>
          <TrashBtn onClick={onDelete} />
        </div>
      </header>
      {tagOpen && (
        <div className="ideas-doc-pop">
          <TagBar
            embedded
            noneLabel="Ohne"
            selectOnCreate
            value={idea.areaId || ''}
            onChange={(id) => {
              updateIdea(idea.id, { areaId: id || null })
              setTagOpen(false)
            }}
          />
        </div>
      )}
      {todoOpen && (
        <div className="ideas-doc-pop">
          <TodoComposer
            exclude={idea.taskIds || []}
            seed={todoDraft}
            onCreate={createTodo}
            onPick={pickTodo}
          />
        </div>
      )}
      {linkOpen && (
        <div className="ideas-doc-pop">
          <form
            className="link-form"
            onSubmit={(e) => {
              e.preventDefault()
              applyLink(urlDraft)
            }}
          >
            <input
              autoFocus
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://…"
              aria-label="Adresse"
            />
            <button type="submit" className="note-tool">
              Los
            </button>
            {marks.link && (
              <button type="button" className="note-tool" onClick={removeLink}>
                Lösen
              </button>
            )}
          </form>
          <p className="ai-hint">Markierung wird zum Link. ⌘-Klick öffnet ihn.</p>
        </div>
      )}
      {aiOpen && (
        <div className="ideas-doc-pop">
          <div className="ai-pop">
            <div className="ai-actions">
              {AI_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="note-tool"
                  disabled={aiBusy}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => runAi(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <form
              className="ai-custom"
              onSubmit={(e) => {
                e.preventDefault()
                const q = aiCustom.trim()
                if (!q) {
                  setAiError('Auftrag schreiben oder eine der Tasten.')
                  return
                }
                runAi('custom', q)
              }}
            >
              <input
                value={aiCustom}
                onChange={(e) => setAiCustom(e.target.value)}
                placeholder="Oder eigener Auftrag…"
                aria-label="Eigener Auftrag"
                disabled={aiBusy}
              />
              <button type="submit" className="note-tool" disabled={aiBusy}>
                {aiBusy ? '…' : 'Los'}
              </button>
            </form>
            {aiError ? <p className="ai-err">{aiError}</p> : <p className="ai-hint">Markierung, sonst der Absatz am Cursor.</p>}
          </div>
        </div>
      )}
      </div>
      <div className="ideas-doc-card">
        <div className="ideas-doc-scroll">
          <textarea
            className="idea-title"
            rows={1}
            placeholder="Titel"
            value={idea.title}
            onChange={(e) => updateIdea(idea.id, { title: e.target.value }, { touch: false })}
            onBlur={() => updateIdea(idea.id, {}, { touch: true })}
          />
          <div
            ref={ref}
            className={
              'note-surface' +
              (empty ? ' is-empty' : '') +
              (listening ? ' is-listening' : '') +
              (aiBusy ? ' is-rewriting' : '')
            }
            contentEditable
            role="textbox"
            aria-multiline="true"
            data-placeholder="Schreib aus. To-dos sitzen im Text — Icon in der Leiste."
            onInput={persist}
            onKeyUp={readMarks}
            onMouseUp={readMarks}
            onKeyDown={onKey}
            onClick={onSurfaceClick}
            onBlur={(e) => {
              onTitleBlur(e)
              persist(e)
            }}
          />
        </div>
      </div>
      {cal &&
        createPortal(
          <>
            <div className="note-cal-scrim" onClick={() => setCal(null)} />
            <div className="note-cal-pop" style={{ top: cal.top, left: cal.left }}>
              <DateMenu
                date={s.tasks.find((t) => t.id === cal.id)?.date}
                weekKey={s.tasks.find((t) => t.id === cal.id)?.weekKey}
                onPick={(spec) => {
                  scheduleTask(cal.id, spec)
                  setCal(null)
                }}
              />
            </div>
          </>,
          document.body,
        )}
    </div>
  )
}

function TodoComposer({ exclude, seed, onCreate, onPick }) {
  const s = useAlba()
  const [q, setQ] = useState(seed || '')
  const hits = searchOpenTasks(s, q, exclude)
  return (
    <div className="todo-composer">
      <form
        className="todo-composer-form"
        onSubmit={(e) => {
          e.preventDefault()
          onCreate(q.trim() || 'To-do')
        }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Neu schreiben oder bestehendes suchen…"
          aria-label="To-do"
        />
        <button type="submit" className="note-tool">
          Neu
        </button>
      </form>
      {hits.length > 0 ? (
        <>
          <p className="quiet">Bestehende</p>
          {hits.map((t) => (
            <button key={t.id} type="button" className="task-search-row" onClick={() => onPick(t)}>
              <span>{t.title}</span>
              <span className="quiet">{pinLabel(t, todayISO()) || 'Neu'}</span>
            </button>
          ))}
        </>
      ) : (
        <p className="ai-hint">Enter legt neu an. Oder zuerst in bestehenden suchen.</p>
      )}
    </div>
  )
}
