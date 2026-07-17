const CACHE_NAME = 'gestatools-v4';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  // Skip waiting allows the new service worker to take over immediately
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  // Claim clients so the new service worker controls them immediately
  e.waitUntil(self.clients.claim());
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;

  // Ignore non-GET requests and non-http protocols (like chrome-extension://)
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  // Navigation requests (HTML pages) -> Network first, fallback to cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(req).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Other assets (JS, CSS, Images, Fonts) -> Stale-While-Revalidate
  e.respondWith(
    caches.match(req).then((cachedResponse) => {
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          // Cache valid responses
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Ignore network errors on background updates
        });

      // Return cache immediately if available, otherwise wait for network
      return cachedResponse || networkFetch;
    })
  );
});

