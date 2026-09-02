const NAV = [
  {
    id: 'today',
    label: 'Heute',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    ),
  },
  {
    id: 'board',
    label: 'To-do',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M8.2 12.3l2.4 2.4 5.2-5.4" />
      </svg>
    ),
  },
  {
    id: 'habits',
    label: 'Routinen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="16" r="3" />
        <path d="M10.2 10.2 13.8 13.8" />
      </svg>
    ),
  },
  {
    id: 'aims',
    label: 'Ziele',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <path d="M4 7h16M6 12h12M8 17h8" />
      </svg>
    ),
  },
  {
    id: 'ideas',
    label: 'Ideen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M7 4.5h10v15l-5-2.4L7 19.5z" />
      </svg>
    ),
  },
  {
    id: 'log',
    label: 'Log',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M6 5h12v14H6z" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
  },
]

export default function Shell({ view, onNavigate, onCapture, onSettings, sky, children }) {
  return (
    <div className="shell">
      <div className="window">
        <aside className="sidebar">
          <div className="side-head">
            <button className="wordmark" onClick={() => onNavigate('today')} aria-label="alba">
              <span>a</span>
              <span className="nav-label">alba</span>
            </button>
          </div>
          <nav className="side-nav">
            {NAV.map((n) => (
              <button
                key={n.id}
                className={view === n.id ? 'active' : ''}
                onClick={() => onNavigate(n.id)}
                aria-label={n.label}
                aria-current={view === n.id ? 'page' : undefined}
              >
                <span className="nav-ico">{n.icon}</span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-foot">
            <button
              className={view === 'settings' ? 'active' : ''}
              onClick={onSettings}
              aria-label="Einstellungen"
              aria-current={view === 'settings' ? 'page' : undefined}
            >
              <span className="nav-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
                </svg>
              </span>
              <span className="nav-label">Einstellungen</span>
            </button>
            <button className="side-add" onClick={onCapture} aria-label="Ablegen">
              <span className="nav-ico">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
              <span className="nav-label">Ablegen</span>
            </button>
          </div>
        </aside>
        <main className="stage">
          <div
            className="stage-sky"
            aria-hidden="true"
            style={sky ? { backgroundImage: `url("${sky}")` } : undefined}
          />
          <div className="stage-scroll">{children}</div>
        </main>
      </div>
      <nav className="mobile-nav">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={view === n.id ? 'active' : ''}
            onClick={() => onNavigate(n.id)}
          >
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
