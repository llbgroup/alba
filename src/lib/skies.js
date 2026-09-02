const base = import.meta.env.BASE_URL || '/'

export const SKIES = [
  { id: 'cloud', label: 'Wolken', src: `${base}sky.jpg` },
  { id: 'dusk', label: 'Abend', src: `${base}dusk.jpg` },
  { id: 'storm', label: 'Sturm', src: `${base}storm.jpg` },
  { id: 'night', label: 'Nacht', src: `${base}night.jpg` },
]

export function skySrc(id, customUrl) {
  if (id === 'custom' && customUrl) return customUrl
  const hit = SKIES.find((s) => s.id === id)
  return hit?.src || `${base}sky.jpg`
}
