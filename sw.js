const CACHE_NAME = 'pitch-io-v9-no-cache';
const ASSETS_TO_CACHE = [
    '/assets/Frame1.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Network-only for main files, Cache-first for others
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // IF it is a local file that is likely to change (HTML, JS, CSS)
    if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname === '/') {
        event.respondWith(fetch(event.request)); // Always network
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
