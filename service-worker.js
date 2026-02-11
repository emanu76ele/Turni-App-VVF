const CACHE_NAME = 'turni-vvf-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/privacy-policy.html',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-128.png',
  '/icons/icon-144.png',
  '/icons/icon-152.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon-180x180.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => {
          return new Request(url, { cache: 'reload' });
        }));
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
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') &&
      !event.request.url.includes('cloudflare.com')) {
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
          return caches.match('/index.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating...');
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

// Background sync for offline data
self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Sync event:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

function syncData() {
  // Placeholder for future sync functionality
  console.log('[Service Worker] Syncing data...');
  return Promise.resolve();
}

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

// Push notification (future feature)
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push notification received');
  // Implementation for push notifications
});

console.log('[Service Worker] Loaded successfully - Version:', CACHE_NAME);
