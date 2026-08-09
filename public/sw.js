const CACHE_NAME = 'gestatools-v8-official-brand-assets';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/browserconfig.xml',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/icons/gestatools-v2/icon-64.png',
  '/icons/gestatools-v2/icon-152.png',
  '/icons/gestatools-v2/icon-167.png',
  '/icons/gestatools-v2/icon-180.png',
  '/icons/gestatools-v2/icon-192.png',
  '/icons/gestatools-v2/icon-512.png',
  '/icons/gestatools-v2/maskable-192.png',
  '/icons/gestatools-v2/maskable-512.png',
  '/icons/gestatools-v2/mstile-150.png',
  '/social/gestatools-og-1200x630.png'
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
  const url = new URL(req.url);

  // Bypass service worker entirely in development / preview containers to prevent stale module caching
  if (
    url.hostname.includes('-dev-') ||
    url.hostname.includes('-pre-') ||
    url.hostname.includes('run.app') ||
    url.hostname.includes('localhost') ||
    url.hostname.includes('127.0.0.1')
  ) {
    return;
  }

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

  // For JS and CSS scripts/styles (code modules), use Network First to prevent stale bundle mismatches
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.includes('/assets/')) {
    e.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Other static assets (Images, Fonts) -> Stale-While-Revalidate
  e.respondWith(
    caches.match(req).then((cachedResponse) => {
      const networkFetch = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {});

      return cachedResponse || networkFetch;
    })
  );
});

