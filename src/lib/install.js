import { useEffect, useState } from 'react'

const HIDE_KEY = 'alba.install.hide'
const LATER_KEY = 'alba.install.later'

let deferredPrompt = null
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}

export function armInstall() {
  if (typeof window === 'undefined' || window.__albaInstallArmed) return
  window.__albaInstallArmed = true
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
  })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.navigator.standalone === true
  )
}

export function isAppleDevice() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}

export function isSafariLike() {
  if (typeof navigator === 'undefined') return false
  if (isAppleDevice()) return true
  const ua = navigator.userAgent
  return /safari/i.test(ua) && !/chrome|chromium|android|edg|crios|fxios/i.test(ua)
}

function isHidden() {
  try {
    return Boolean(localStorage.getItem(HIDE_KEY) || sessionStorage.getItem(LATER_KEY))
  } catch {
    return false
  }
}

export function hideInstall() {
  try {
    localStorage.setItem(HIDE_KEY, '1')
  } catch {
    /* ignore */
  }
  emit()
}

export function laterInstall() {
  try {
    sessionStorage.setItem(LATER_KEY, '1')
  } catch {
    /* ignore */
  }
  emit()
}

export function useInstallPrompt() {
  const [, bump] = useState(0)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onChange = () => {
      setInstalled(isStandalone())
      bump((n) => n + 1)
    }
    listeners.add(onChange)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', onChange)
    return () => {
      listeners.delete(onChange)
      mq.removeEventListener?.('change', onChange)
    }
  }, [])

  async function install() {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    deferredPrompt = null
    emit()
    return choice.outcome === 'accepted'
  }

  return {
    canPrompt: Boolean(deferredPrompt) && !installed && !isHidden(),
    canInstall: Boolean(deferredPrompt) && !installed,
    installed,
    apple: isSafariLike(),
    install,
  }
}
