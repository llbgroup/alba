const CACHE = 'alba-v1'

const PRECACHE = ['/', '/index.html', '/manifest.json', '/favicon.svg', '/icon-192.png', '/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => {})))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

function passThrough(url) {
  if (url.origin !== self.location.origin) return true
  const { pathname, searchParams } = url
  if (pathname.startsWith('/api/')) return true
  if (pathname.startsWith('/@') || pathname.startsWith('/src/') || pathname.startsWith('/node_modules/')) return true
  if (pathname.includes('.vite') || searchParams.has('t') || searchParams.has('import')) return true
  return false
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const fresh = await fetch(request)
    if (fresh && fresh.ok) cache.put(request, fresh.clone())
    return fresh
  } catch {
    const cached = await cache.match(request)
    if (cached) return cached
    return cache.match('/index.html')
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  if (fresh && fresh.ok) cache.put(request, fresh.clone())
  return fresh
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const fetching = fetch(request)
    .then((fresh) => {
      if (fresh && fresh.ok) cache.put(request, fresh.clone())
      return fresh
    })
    .catch(() => cached)
  return cached || fetching
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (passThrough(url)) return

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request))
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})
