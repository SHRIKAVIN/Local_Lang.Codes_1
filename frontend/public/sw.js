const CACHE_NAME = 'llc-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/public/vite.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
}); 