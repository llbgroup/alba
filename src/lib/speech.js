export function SpeechEngine() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function createRecognition({
  lang = 'de-DE',
  onFinal,
  onInterim,
  onError,
  onEnd,
} = {}) {
  const Ctor = SpeechEngine()
  if (!Ctor) return null
  const rec = new Ctor()
  rec.lang = lang
  rec.continuous = true
  rec.interimResults = true
  rec.onresult = (ev) => {
    let added = ''
    let interim = ''
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript
      if (ev.results[i].isFinal) added += t + ' '
      else interim += t
    }
    if (added) onFinal?.(added)
    onInterim?.(interim)
  }
  rec.onerror = () => onError?.()
  rec.onend = () => onEnd?.(rec)
  return rec
}
