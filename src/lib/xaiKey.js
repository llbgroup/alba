const KEY = 'alba.xai.v1'

export function getXaiKey() {
  try {
    return localStorage.getItem(KEY) || ''
  } catch {
    return ''
  }
}

export function setXaiKey(value) {
  try {
    const v = (value || '').trim()
    if (v) localStorage.setItem(KEY, v)
    else localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
