const ALLOWED = new Set(['H2', 'H3', 'P', 'B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'BR', 'IMG', 'DIV', 'SPAN', 'MARK', 'A'])

export function bodyToHtml(body) {
  const raw = body || ''
  if (!raw.trim()) return ''
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeNoteHtml(raw)
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\n/g, '<br>')
}

export function htmlToPreview(body) {
  const text = (body || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(h2|h3|p|li|div)>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/\s+/g, ' ')
    .trim()
  return text.slice(0, 88)
}

export function sanitizeNoteHtml(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html')
  clean(doc.body)
  return doc.body.innerHTML
}

function clean(node) {
  ;[...node.childNodes].forEach((child) => {
    if (child.nodeType === 1) {
      if (!ALLOWED.has(child.tagName)) {
        const parent = child.parentNode
        while (child.firstChild) parent.insertBefore(child.firstChild, child)
        parent.removeChild(child)
        return
      }
      if (child.tagName === 'SPAN') {
        clean(child)
        unwrap(child)
        return
      }
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') || ''
        const safe = /^https?:\/\//i.test(href) || /^mailto:/i.test(href)
        ;[...child.attributes].forEach((attr) => child.removeAttribute(attr.name))
        if (!safe) {
          clean(child)
          unwrap(child)
          return
        }
        child.className = 'note-link'
        child.setAttribute('href', href)
        child.setAttribute('target', '_blank')
        child.setAttribute('rel', 'noopener noreferrer')
        clean(child)
        return
      }
      if (child.tagName === 'MARK') child.className = 'note-mark'
      if (child.classList?.contains('note-todo')) {
        const id = child.getAttribute('data-task-id')
        ;[...child.attributes].forEach((attr) => child.removeAttribute(attr.name))
        child.className = 'note-todo'
        if (id) child.setAttribute('data-task-id', id)
        child.setAttribute('contenteditable', 'false')
        child.innerHTML = ''
        return
      }
      ;[...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase()
        if (child.tagName === 'IMG' && name === 'src') {
          const v = attr.value || ''
          if (v.startsWith('data:image/') || v.startsWith('blob:')) return
          child.removeAttribute(attr.name)
          return
        }
        if (child.tagName === 'IMG' && name === 'alt') return
        if (child.tagName === 'MARK') {
          if (name === 'class') {
            child.className = 'note-mark'
            return
          }
        }
        child.removeAttribute(attr.name)
      })
      clean(child)
    }
  })
}

function unwrap(el) {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

export function serializeNoteHtml(root) {
  const clone = root.cloneNode(true)
  clone.querySelectorAll('.note-dictation').forEach((n) => n.remove())
  clone.querySelectorAll('.note-ai-target').forEach(unwrap)
  clone.querySelectorAll('.note-todo').forEach((n) => {
    const id = n.getAttribute('data-task-id')
    n.innerHTML = ''
    n.className = 'note-todo'
    if (id) n.setAttribute('data-task-id', id)
    n.setAttribute('contenteditable', 'false')
  })
  return sanitizeNoteHtml(clone.innerHTML)
}

export function taskIdsInHtml(html) {
  return [...String(html || '').matchAll(/data-task-id="([^"]+)"/g)].map((m) => m[1]).filter(Boolean)
}
