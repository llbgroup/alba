export const SKIES = [
  { id: 'cloud', label: 'Wolken', src: '/sky.jpg' },
  { id: 'dusk', label: 'Abend', src: '/dusk.jpg' },
  { id: 'storm', label: 'Sturm', src: '/storm.jpg' },
  { id: 'night', label: 'Nacht', src: '/night.jpg' },
]

export function skySrc(id, customUrl) {
  if (id === 'custom' && customUrl) return customUrl
  const hit = SKIES.find((s) => s.id === id)
  return hit?.src || '/sky.jpg'
}
