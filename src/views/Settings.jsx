import { useRef, useState } from 'react'
import {
  exportState,
  fillDemo,
  getCustomSky,
  importState,
  resetAll,
  setBackground,
  setCustomBackground,
  setName,
  setTheme,
  useAlba,
} from '../store'
import { getXaiKey, setXaiKey } from '../lib/xaiKey'
import { SKIES } from '../lib/skies'
import { useInstallPrompt } from '../lib/install'
import { downloadAgentsGuide, downloadAnleitung } from '../lib/docs'

function readSkyFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const max = 1920
      let w = img.width
      let h = img.height
      if (w > max) {
        h = Math.round((h * max) / w)
        w = max
      }
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.78))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Bild unlesbar'))
    }
    img.src = url
  })
}

export default function Settings() {
  const s = useAlba()
  const file = useRef(null)
  const skyFile = useRef(null)
  const [xai, setXai] = useState(() => getXaiKey())
  const custom = getCustomSky()
  const bg = s.profile.background || 'cloud'
  const install = useInstallPrompt()

  return (
    <div className="page">
      <div className="dateblock">
        <p className="dow">Werkzeug</p>
        <h1 className="daynum" style={{ fontSize: 'clamp(42px, 7vw, 64px)' }}>
          Einstellungen
        </h1>
        <p className="month">Lokal auf diesem Gerät. Kein Konto, keine Wolke.</p>
      </div>

      <div className="settings-list">
        <div className="field">
          <label>Name</label>
          <input
            value={s.profile.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wie soll es dich nennen?"
          />
        </div>
        <div>
          <span className="section-label">Thema</span>
          <div className="theme-switch" style={{ marginTop: 10 }}>
            {['dusk', 'paper'].map((t) => (
              <button
                key={t}
                className={'preset' + (s.profile.theme === t ? ' on' : '')}
                onClick={() => setTheme(t)}
              >
                <b>{t === 'dusk' ? 'Küste' : 'Papier'}</b>
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="section-label">Himmel</span>
          <p className="quiet" style={{ margin: '8px 0 12px' }}>
            Zeigt sich im Thema Küste. Eigenes Bild bleibt auf diesem Gerät.
          </p>
          <div className="sky-grid">
            {SKIES.map((sky) => (
              <button
                key={sky.id}
                type="button"
                className={'sky-swatch' + (bg === sky.id ? ' on' : '')}
                style={{ backgroundImage: `url("${sky.src}")` }}
                onClick={() => setBackground(sky.id)}
              >
                <span>{sky.label}</span>
              </button>
            ))}
            <button
              type="button"
              className={'sky-swatch' + (bg === 'custom' ? ' on' : '')}
              style={custom ? { backgroundImage: `url("${custom}")` } : undefined}
              onClick={() => {
                if (custom && bg !== 'custom') setBackground('custom')
                else skyFile.current?.click()
              }}
            >
              <span>Eigenes</span>
            </button>
          </div>
          <input
            ref={skyFile}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const data = await readSkyFile(f)
                setCustomBackground(data)
              } catch {
                /* ignore */
              }
            }}
          />
          {custom && (
            <button className="btn quiet" onClick={() => skyFile.current?.click()}>
              Eigenes Bild ersetzen
            </button>
          )}
        </div>

        <hr className="rule" />

        <div className="field">
          <label>xAI-Schlüssel</label>
          <p className="quiet" style={{ margin: '8px 0 10px' }}>
            Für Korrigieren und Ausformulieren in Ideen. Bleibt auf diesem Gerät, geht nicht in die App-Datei.
          </p>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={xai}
            placeholder="xai-…"
            onChange={(e) => {
              setXai(e.target.value)
              setXaiKey(e.target.value)
            }}
          />
        </div>

        <hr className="rule" />

        <div>
          <span className="section-label">Als App</span>
          {install.installed ? (
            <p className="quiet" style={{ margin: '8px 0 0' }}>
              Läuft eigenständig — ohne Browserleiste.
            </p>
          ) : (
            <>
              <p className="quiet" style={{ margin: '8px 0 12px' }}>
                {install.apple
                  ? 'Teilen, dann „Zum Home-Bildschirm“. Auf dem Mac: Ablage → Zum Dock hinzufügen.'
                  : 'Unten rechts, oder das Install-Symbol in der Adresszeile.'}
              </p>
              {install.canInstall && (
                <button className="btn" type="button" onClick={() => install.install()}>
                  Als App installieren
                </button>
              )}
            </>
          )}
        </div>

        <hr className="rule" />

        <div>
          <span className="section-label">Anleitung</span>
          <p className="quiet" style={{ margin: '8px 0 12px' }}>
            Für dich, und eine Datei für eine AI, der du den GitHub-Link gibst.
          </p>
          <div className="row-btns">
            <button className="btn ghost" type="button" onClick={downloadAnleitung}>
              Anleitung speichern
            </button>
            <button className="btn ghost" type="button" onClick={downloadAgentsGuide}>
              AI-Anleitung speichern
            </button>
          </div>
        </div>

        <hr className="rule" />

        <div>
          <span className="section-label">Tasten</span>
          <p className="quiet">
            <span className="kbd">C</span> oder <span className="kbd">N</span> ablegen ·{' '}
            <span className="kbd">⌘K</span> palettenartig · <span className="kbd">Esc</span> schließen
          </p>
        </div>

        <hr className="rule" />

        <div>
          <span className="section-label">Warum so</span>
          <ul className="principles">
            <li>
              Ablegen, dann datieren. To-do hält den Vorrat, Heute nur den Tag. Ziele sind Sätze, keine Ordner. Ideen sind Dokumente, ihre To-dos liegen im selben Stapel.
            </li>
            <li>
              Drei Tagesaufgaben plus ein Highlight schlagen lange Listen. Sichtbare Priorität hält den Fokus.
            </li>
            <li>
              Gewohnheit = Anker × winzige Handlung × Wiederholung im gleichen Kontext. Deshalb Wenn-dann, Mini-Version,
              Abhaken.
            </li>
            <li>
              Ein verpasster Tag bricht keine Automatik. Zwei in Folge sind das Muster. Deshalb Dichte statt Streak,
              und gestern noch nachtragen.
            </li>
            <li>
              Identität vor Outcome: nicht „30 Tage Training“, sondern „ich bin jemand, der sich bewegt.“
            </li>
            <li>
              Offene Listen im Kopf verbrauchen Aufmerksamkeit. Deshalb: alles ablegen, dann wählen.
            </li>
            <li>
              Pläne müssen sich biegen. Verschieben und Loslassen sind erstklassige Aktionen, kein Scheitern.
            </li>
          </ul>
        </div>

        <hr className="rule" />

        <div className="row-btns">
          <button
            className="btn ghost"
            onClick={() => {
              if (
                confirm(
                  'Beispieldaten laden? To-dos, Ideen, Ziele und Routinen werden ersetzt. Vorher exportieren, wenn du deinen Stand behalten willst.',
                )
              )
                fillDemo(true)
            }}
          >
            Beispieldaten laden
          </button>
          <button className="btn ghost" onClick={exportState}>
            Export JSON
          </button>
          <button className="btn ghost" onClick={() => file.current?.click()}>
            Import
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const text = await f.text()
              importState(text, 'replace')
            }}
          />
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Alles auf diesem Gerät löschen?')) resetAll()
            }}
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  )
}
