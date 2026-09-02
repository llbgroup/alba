import { useEffect, useState } from 'react'
import { hideInstall, laterInstall, useInstallPrompt } from '../lib/install'

export default function InstallChip({ suppressed }) {
  const { canPrompt, install } = useInstallPrompt()
  const [settled, setSettled] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 1200)
    return () => clearTimeout(t)
  }, [])

  if (!settled || suppressed || !canPrompt) return null

  return (
    <aside className="install-chip" role="dialog" aria-label="Als App installieren">
      <button className="install-x" type="button" aria-label="Nicht mehr zeigen" onClick={hideInstall}>
        ×
      </button>
      <p className="install-kicker">Alba</p>
      <p className="install-copy">Als App auf diesem Rechner. Eigenes Fenster, ohne Leiste.</p>
      <div className="install-actions">
        <button
          className="btn"
          type="button"
          onClick={() => {
            install()
          }}
        >
          Installieren
        </button>
        <button className="btn quiet" type="button" onClick={laterInstall}>
          Später
        </button>
      </div>
    </aside>
  )
}
