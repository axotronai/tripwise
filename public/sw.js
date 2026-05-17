const CACHE = 'tripwise-v1'
const OFFLINE_URL = '/'

// Assets to pre-cache on install
const PRECACHE = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Never intercept API, Supabase, or non-GET requests
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.hostname.includes('supabase')) return
  if (url.hostname.includes('groq')) return

  // Navigation requests: network-first, fall back to cached home
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(js|css|png|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Everything else: network-first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})
