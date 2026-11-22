const tileCacheName = 'ets2-map-tiles-v4';
const tilePath = /^\/\d+\.\d+\/(?:ATS|ETS2)\/(?:American|TMP|American_Promods|TMP_Promods|Europe|Europe_Promods)\/\d+\/\d+\/\d+\.png$/;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('ets2-map-tiles-') && name !== tileCacheName)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !tilePath.test(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(tileCacheName);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === 'basic' && response.headers.get('Content-Type')?.includes('image/png')) {
      await cache.put(request, response.clone());
    }
    return response;
  })());
});
