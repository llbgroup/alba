import anleitung from '../../ANLEITUNG.md?raw'
import agents from '../../AGENTS.md?raw'

function save(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadAnleitung() {
  save('Alba-Anleitung.md', anleitung)
}

export function downloadAgentsGuide() {
  save('Alba-AGENTS.md', agents)
}
