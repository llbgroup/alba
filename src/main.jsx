import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { armInstall } from './lib/install'

armInstall()

if ('serviceWorker' in navigator) {
  const swUrl = `${import.meta.env.BASE_URL}sw.js`
  const scope = import.meta.env.BASE_URL
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {})
  })
  if (import.meta.env.PROD) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__albaSwReload) return
      window.__albaSwReload = true
      location.reload()
    })
    const ping = () => navigator.serviceWorker.getRegistration(scope).then((reg) => reg?.update())
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') ping()
    })
    setInterval(ping, 30 * 60 * 1000)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
