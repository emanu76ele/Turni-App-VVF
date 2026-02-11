const CACHE_NAME = 'turni-vvf-v1.0.2';
const urlsToCache = [
  '/Turni-App-VVF/',
  '/Turni-App-VVF/index.html',
  '/Turni-App-VVF/manifest.json',
  '/Turni-App-VVF/privacy-policy.html',
  '/Turni-App-VVF/icons/icon-192.png',
  '/Turni-App-VVF/icons/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing v1.0.2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching app shell');
        // Cache i file uno per uno per evitare errori
        return Promise.all(
          urlsToCache.map(function(url) {
            return cache.add(url).catch(function(error) {
              console.log('[Service Worker] Failed to cache:', url, error);
              // Non bloccare l'installazione se un file fallisce
              return Promise.resolve();
            });
          })
        );
      })
      .then(function() {
        console.log('[Service Worker] Install completed');
      })
      .catch(function(error) {
        console.error('[Service Worker] Install failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          function(response) {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function(error) {
          console.error('[Service Worker] Fetch failed:', error);
          // Return offline page or fallback if needed
          return caches.match('/Turni-App-VVF/index.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating v1.0.2...');
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[Service Worker] Activation completed');
    })
  );
  
  return self.clients.claim();
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

console.log('[Service Worker] Loaded successfully - Version:', CACHE_NAME);
