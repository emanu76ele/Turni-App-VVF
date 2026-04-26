const CACHE_NAME = 'turni-vvf-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
    // Avvia il controllo periodico delle notifiche
    controllaNotifiche();
});

// Fetch
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

// Controlla notifiche in background
function controllaNotifiche() {
    // Controlla ogni minuto
    setInterval(() => {
        self.clients.matchAll().then(clients => {
            // Ottieni le notifiche salvate dal localStorage tramite il client
            if (clients.length > 0) {
                clients[0].postMessage({ type: 'CHECK_NOTIFICATIONS' });
            }
        });
    }, 60000);
}

// Ricevi messaggi dal client
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { notifiche } = event.data;
        notifiche.forEach(notif => {
            const msAlla = notif.tempoNotifica - Date.now();
            if (msAlla > 0 && msAlla < 24 * 60 * 60 * 1000) { // solo entro 24h
                setTimeout(() => {
                    self.registration.showNotification(`🚒 Turni VVF - ${notif.tipo}`, {
                        body: `Il tuo servizio inizia tra poco!\n📅 ${notif.data}`,
                        icon: '/icons/icon-192.png',
                        badge: '/icons/icon-72.png',
                        tag: `vvf-${notif.id}`,
                        requireInteraction: true,
                        vibrate: [200, 100, 200]
                    });
                }, msAlla);
            }
        });
    }
});

// Gestisci click sulla notifica
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            if (clients.length > 0) {
                clients[0].focus();
            } else {
                self.clients.openWindow('/');
            }
        })
    );
});
