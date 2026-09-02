import { useEffect, useRef, useState } from 'react'

export function usePinned() {
  const ref = useRef(null)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    const el = ref.current
    const root = el?.closest('.stage-scroll')
    if (!el || !root) return
    let on = false
    const read = () => {
      const pad = parseFloat(getComputedStyle(root).paddingTop) || 0
      const limit = root.getBoundingClientRect().top + pad
      const prev = el.previousElementSibling
      const titleGone = !prev || prev.getBoundingClientRect().bottom <= limit - 10
      if (!on && titleGone) on = true
      else if (on && prev && prev.getBoundingClientRect().bottom > limit + 8) on = false
      setPinned(on)
    }
    root.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    read()
    return () => {
      root.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  return [ref, pinned]
}
