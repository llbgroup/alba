import { useEffect } from 'react'
import { usePinned } from '../lib/usePinned'

export default function WorkStick({ children }) {
  const [ref, pinned] = usePinned()
  useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    parent.classList.toggle('is-pinned', pinned)
    return () => parent.classList.remove('is-pinned')
  }, [pinned, ref])
  return (
    <div ref={ref} className={'work-stick' + (pinned ? ' is-pinned' : '')}>
      {children}
    </div>
  )
}
