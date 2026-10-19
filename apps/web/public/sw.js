// BreakTym Service Worker: Web Push Delivery & Lifecycle Management
// Standards: Push API, Notifications API, Service Worker API

const SW_VERSION = 'breaktym-sw-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. PUSH EVENT LISTENER
// Safely unpacks JSON/Text push payload and displays persistent system notification
self.addEventListener('push', (event) => {
  let payload = {
    title: 'BreakTym ☕',
    body: 'You have a new activity update on BreakTym!',
    tag: 'breaktym-general',
    url: '/',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
        data: {
          ...payload.data,
          ...(parsed.data || {}),
          url: parsed.url || parsed.data?.url || '/',
          invitationId: parsed.invitationId || parsed.data?.invitationId,
        },
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || '/icon.svg',
    badge: payload.badge || '/icon.svg',
    tag: payload.tag || 'breaktym-notification',
    renotify: true,
    vibrate: [120, 60, 120],
    data: payload.data,
    actions: [
      { action: 'open', title: 'Open Plan ✨' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// 2. NOTIFICATION CLICK LISTENER
// Manages foreground focusing, message passing to active tabs, and window opening
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user clicked the "dismiss" action, simply close
  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';
  const invitationId = notifData.invitationId;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windowClients) => {
      // Check if an existing BreakTym window/tab is already open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          await client.focus();
          // Send internal event to active tab to open modal or route to invitation
          if (invitationId && 'postMessage' in client) {
            client.postMessage({
              type: 'NAVIGATE_INVITATION',
              invitationId,
              url: targetUrl,
            });
          }
          return;
        }
      }

      // No open client found: open a fresh window to the destination
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
