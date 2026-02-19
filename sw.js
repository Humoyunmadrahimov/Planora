const CACHE_NAME = 'pitch-io-v7'; // Bump version
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/style.css',
    '/script.js',
    '/assets/Frame1.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://unpkg.com/lucide@latest'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Caching assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Clearing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            ).then(() => self.clients.claim()); // Take control of all open clients
        })
    );
});

// Fetch: Network-first approach for HTML/JS/CSS to ensure latest version
self.addEventListener('fetch', (event) => {
    // For HTML and scripts, try network first
    if (event.request.mode === 'navigate' ||
        event.request.url.includes('script.js') ||
        event.request.url.includes('style.css')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Update cache as we go
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request)) // Fallback to cache if offline
        );
    } else {
        // For images and fonts, cache-first is fine
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    }
});
