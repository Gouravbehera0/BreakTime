// BreakTym Service Worker for Web Push and Offline Reliability
const CACHE_NAME = 'breaktym-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle push notification events
self.addEventListener('push', (event) => {
  let payload = {
    title: 'BreakTym Invitation',
    body: 'You have a new spontaneous break invitation!',
    url: '/',
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: payload.url || '/',
      invitationId: payload.invitationId,
    },
    actions: [
      { action: 'open', title: 'Open BreakTym' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'BreakTym', notificationOptions)
  );
});

// Handle notification click to bring app to foreground
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
