/**
 * Browser push notification and service worker helper for BreakTym
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.warn('[BreakTym Push] Service Worker registration notice:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'default';
  }
}

export async function showBrowserNotification(
  title: string,
  optionsOrBody: string | { body?: string; tag?: string; url?: string },
  url = '/'
): Promise<void> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const body = typeof optionsOrBody === 'string' ? optionsOrBody : optionsOrBody.body || '';
  const tag = typeof optionsOrBody === 'object' ? optionsOrBody.tag : undefined;
  const targetUrl = typeof optionsOrBody === 'object' && optionsOrBody.url ? optionsOrBody.url : url;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          tag,
          icon: '/icon.svg',
          badge: '/icon.svg',
          data: { url: targetUrl },
        });
        return;
      }
    }

    new Notification(title, {
      body,
      tag,
      icon: '/icon.svg',
    });
  } catch (err) {
    console.warn('[BreakTym Push] Error showing browser notification:', err);
  }
}
