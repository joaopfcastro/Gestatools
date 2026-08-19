const CACHE_NAME = 'gestatools-v9-pwa-native';

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
  '/apple-touch-icon-precomposed.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-180x180-precomposed.png',
  '/apple-touch-icon-167x167.png',
  '/apple-touch-icon-152x152.png',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-192x192.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/icons/gestatools-v2/icon-64.png',
  '/icons/gestatools-v2/icon-96.png',
  '/icons/gestatools-v2/icon-128.png',
  '/icons/gestatools-v2/icon-144.png',
  '/icons/gestatools-v2/icon-152.png',
  '/icons/gestatools-v2/icon-167.png',
  '/icons/gestatools-v2/icon-180.png',
  '/icons/gestatools-v2/icon-192.png',
  '/icons/gestatools-v2/icon-256.png',
  '/icons/gestatools-v2/icon-384.png',
  '/icons/gestatools-v2/icon-512.png',
  '/icons/gestatools-v2/icon-1024.png',
  '/icons/gestatools-v2/maskable-192.png',
  '/icons/gestatools-v2/maskable-512.png',
  '/social/gestatools-og-1200x630.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('Pre-cache error (non-fatal):', err);
      });
    })
  );
});

self.addEventListener('activate', (e) => {
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
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // Navigation requests (HTML pages) -> Network First with immediate fallback to cache
  if (req.mode === 'navigate') {
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
        .catch(() => {
          return caches.match(req).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Static brand assets, fonts, icons -> Cache First with Network Fallback
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/social/') ||
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.includes('favicon') ||
    url.pathname.includes('android-chrome') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname === '/manifest.json'
  ) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, cacheCopy);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // JS & CSS code bundles -> Network First, fallback to cache
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

  // All other resources (data, API, images) -> Stale While Revalidate
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

