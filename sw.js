const CACHE_NAME = 'finance-tracker-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Only handle same-origin GET requests (the app shell). Let everything else —
  // Firebase Auth / Firestore / Google sign-in, and any POST — go straight to the
  // network untouched, or they break with auth/network-request-failed.
  if (req.method !== 'GET') return;
  let sameOrigin = false;
  try { sameOrigin = new URL(req.url).origin === self.location.origin; } catch (e) {}
  if (!sameOrigin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      fetch(req).then(response => {
        if (response.ok) cache.put(req, response.clone());
        return response;
      }).catch(() => cache.match(req).then(r => r || cache.match('./index.html')))
    )
  );
});
