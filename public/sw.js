/**
 * Lumira service worker — Pi Browser cache buster.
 *
 * Pi Browser aggressively caches HTML/JS, so users get stuck on stale
 * publishes. This SW:
 *   1. Skips waiting + claims clients immediately on every update.
 *   2. Wipes ALL Cache Storage entries on activate (clears legacy SW caches).
 *   3. Uses network-first for navigation/HTML so the freshest publish wins;
 *      falls through to network for everything else (no caching layer).
 *   4. Bumps BUILD_VERSION every load via the ?v= query in the registration
 *      URL — any change forces Pi Browser to refetch this file.
 */
const BUILD_VERSION = 'lumira-sw-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      for (const client of clientsList) {
        client.postMessage({ type: 'SW_ACTIVATED', version: BUILD_VERSION });
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNavigation) {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => fetch(req))
    );
  }
  // For non-HTML requests, do nothing — let the browser handle it normally.
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
