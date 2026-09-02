import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { armInstall } from './lib/install'

armInstall()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
  if (import.meta.env.PROD) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (window.__albaSwReload) return
      window.__albaSwReload = true
      location.reload()
    })
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
