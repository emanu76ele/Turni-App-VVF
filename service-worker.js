const CACHE_NAME = 'turni-vvf-v1.3.0';
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
  console.log('[Service Worker] Installing v1.3.0...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching app shell');
        return Promise.all(
          urlsToCache.map(function(url) {
            return cache.add(url).catch(function(error) {
              console.log('[Service Worker] Failed to cache:', url, error);
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
  // Forza il nuovo SW ad attivarsi subito senza aspettare
  self.skipWaiting();
});

// Fetch event - network first, then cache
// Strategia "network first" per index.html così prende sempre la versione aggiornata
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isHTML = requestUrl.pathname.endsWith('.html') || 
                 requestUrl.pathname.endsWith('/') ||
                 requestUrl.pathname === '/Turni-App-VVF';

  if (isHTML) {
    // NETWORK FIRST per HTML: prende sempre la versione aggiornata dal server
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(function() {
          // Fallback alla cache se offline
          return caches.match(event.request)
            .then(function(cached) {
              return cached || caches.match('/Turni-App-VVF/index.html');
            });
        })
    );
  } else {
    // CACHE FIRST per risorse statiche (icone, manifest)
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request).then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
            return response;
          }).catch(function() {
            return caches.match('/Turni-App-VVF/index.html');
          });
        })
    );
  }
});

// Activate event - elimina TUTTE le cache vecchie
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating v1.3.0...');
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
      console.log('[Service Worker] Activation completed - old caches cleared');
      // Prende il controllo di tutte le pagine aperte immediatamente
      return self.clients.claim();
    })
  );
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
