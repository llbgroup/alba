import { useEffect, useState } from 'react'
import { getCustomSky, useAlba } from './store'
import { skySrc } from './lib/skies'
import Shell from './components/Shell'
import Capture from './components/Capture'
import Toast from './components/Toast'
import InstallChip from './components/InstallChip'
import Today from './views/Today'
import Board from './views/Board'
import Ideas from './views/Ideas'
import Aims from './views/Aims'
import Habits from './views/Habits'
import Log from './views/Log'
import Settings from './views/Settings'

const VIEWS = ['today', 'board', 'aims', 'ideas', 'habits', 'log', 'settings']

function parseHash() {
  const raw = (location.hash || '').replace(/^#\/?/, '')
  const head = raw.split('/')[0]
  if (head === 'plan' || head === 'ziele') return 'aims'
  if (head === 'todo' || head === 'todos') return 'board'
  if (head === 'journal') return 'log'
  return VIEWS.includes(head) ? head : 'today'
}

export default function App() {
  const s = useAlba()
  const [view, setView] = useState(parseHash)
  const [captureOpen, setCaptureOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = s.profile.theme || 'dusk'
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', s.profile.theme === 'paper' ? '#f3ebdd' : '#1c2228')
  }, [s.profile.theme])

  useEffect(() => {
    const onHash = () => setView(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    function onKey(e) {
      const t = e.target
      const typing =
        t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCaptureOpen(true)
        return
      }
      if (typing) {
        if (e.key === 'Escape') t.blur()
        return
      }
      if (e.key === 'c' || e.key === 'n' || e.key === '+') {
        e.preventDefault()
        setCaptureOpen(true)
      }
      if (e.key === 'Escape') setCaptureOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function navigate(v) {
    location.hash = '#/' + v
    setView(v)
  }

  const screen =
    view === 'board' ? (
      <Board />
    ) : view === 'aims' ? (
      <Aims />
    ) : view === 'ideas' ? (
      <Ideas />
    ) : view === 'habits' ? (
      <Habits />
    ) : view === 'log' ? (
      <Log />
    ) : view === 'settings' ? (
      <Settings />
    ) : (
      <Today />
    )

  return (
    <div data-theme={s.profile.theme}>
      <Shell
        view={view}
        sky={skySrc(s.profile.background, getCustomSky())}
        onNavigate={navigate}
        onCapture={() => setCaptureOpen(true)}
        onSettings={() => navigate('settings')}
      >
        {screen}
      </Shell>
      <Capture
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        defaultWhen={view === 'today' ? 'today' : 'inbox'}
      />
      <Toast toast={s.toast} />
      <InstallChip suppressed={captureOpen} />
    </div>
  )
}
