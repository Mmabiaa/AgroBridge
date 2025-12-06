/**
 * Service Worker for Push Notifications
 * Handles push notification events and displays notifications
 */

// Service worker version
const SW_VERSION = '1.0.0';
const CACHE_NAME = `agrobridge-cache-v${SW_VERSION}`;

// Install event
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing version:', SW_VERSION);
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating version:', SW_VERSION);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);

    let notificationData = {
        title: 'AgroBridge Notification',
        body: 'You have a new notification',
        icon: '/logo.png',
        badge: '/badge.png',
        tag: 'default',
        requireInteraction: false,
        data: {},
    };

    // Parse push data if available
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.message || data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || data.id || notificationData.tag,
                requireInteraction: data.requireInteraction || false,
                data: data,
            };

            // Add action buttons if provided
            if (data.actions && Array.isArray(data.actions)) {
                notificationData.actions = data.actions;
            }

            // Add image if provided
            if (data.image) {
                notificationData.image = data.image;
            }

            // Add vibration pattern if provided
            if (data.vibrate) {
                notificationData.vibrate = data.vibrate;
            }
        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
        }
    }

    // Show notification
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    // Handle action button clicks
    if (event.action) {
        console.log('[Service Worker] Action clicked:', event.action);
        
        // Handle specific actions
        const actionUrl = event.notification.data?.actions?.find(
            (a) => a.action === event.action
        )?.url;

        if (actionUrl) {
            event.waitUntil(
                clients.openWindow(actionUrl)
            );
            return;
        }
    }

    // Default click behavior - open the app
    const urlToOpen = event.notification.data?.url || '/notifications';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    // Focus existing window and navigate to notification URL
                    return client.focus().then(() => {
                        if ('navigate' in client) {
                            return client.navigate(urlToOpen);
                        }
                    });
                }
            }

            // No window open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('[Service Worker] Notification closed:', event);
    
    // Track notification dismissal if needed
    if (event.notification.data?.trackDismissal) {
        // Send analytics or tracking data
        console.log('[Service Worker] Tracking notification dismissal');
    }
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: SW_VERSION });
    }
});

// Fetch event - basic caching strategy (optional)
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip caching for API requests
    if (event.request.url.includes('/api/')) {
        return;
    }

    // Network-first strategy for other requests
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone the response
                const responseToCache = response.clone();

                // Cache the response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // If network fails, try to serve from cache
                return caches.match(event.request);
            })
    );
});

console.log('[Service Worker] Loaded version:', SW_VERSION);
