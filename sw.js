const CACHE_NAME = 'hybrid-engine-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/engine/script-storage.js',
    '/engine/marketplace-client.js',
    '/engine/hybrid-engine.js',
    'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
