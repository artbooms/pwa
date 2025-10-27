// ARTBOOMS PWA - Service Worker con cache offline intelligente
const CACHE_NAME = 'artbooms-cache-v2';
const MAX_ITEMS = 50;
const PRECACHE_URLS = [
  '/', 
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Installazione: salva la home, manifest e icone
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Attivazione: rimuove vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Intercetta tutte le richieste
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request)
        .then(networkResponse => {
          if (
            networkResponse.ok &&
            (
              request.url.includes('/blog/') ||
              request.url.endsWith('.webp') ||
              request.destination === 'document'
            )
          ) {
            const cloned = networkResponse.clone();
            caches.open(CACHE_NAME).then(async cache => {
              await cache.put(request, cloned);
              limitCacheSize(cache);
            });
          }
          return networkResponse;
        })
        .catch(() => offlineResponse());
    })
  );
});

// Limita la dimensione della cache
async function limitCacheSize(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_ITEMS) {
    await cache.delete(keys[0]);
    limitCacheSize(cache);
  }
}

// Messaggio offline personalizzato
function offlineResponse() {
  const html = `
    <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>Offline</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 100vh;
            background: #ffffff;
            color: #000000;
            margin: 0;
            padding: 20px;
          }
          h1 {
            font-size: 1.5rem;
            margin-bottom: 0.2em;
          }
          p {
            font-size: 1rem;
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <h1>Oppss al momento sei offline!</h1>
        <p>Ci vediamo tra pochissimo!</p>
      </body>
    </html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
