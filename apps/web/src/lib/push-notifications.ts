/**
 * Browser Web Push Notification and Service Worker Management for BreakTym
 * Standards-compliant implementation using Push API, Notifications API, and VAPID authentication.
 */

import { supabase } from '@/lib/supabase';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

/**
 * Converts a base64-encoded VAPID public key into a Uint8Array required by PushManager
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether the current browser and environment support Web Push notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Gets the current Notification permission status
 */
export function getNotificationPermission(): PushPermissionStatus {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as PushPermissionStatus;
}

/**
 * Reads the public VAPID key configured in frontend environment variables
 */
export function getVapidPublicKey(): string {
  return (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) || '';
}

/**
 * Registers the root BreakTym service worker (/sw.js)
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Wait until the service worker is active
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[BreakTym Push] Service Worker registration notice:', err);
    return null;
  }
}

/**
 * Retrieves the existing PushSubscription for this browser, if any
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[BreakTym Push] Error fetching existing subscription:', err);
    return null;
  }
}

/**
 * Requests browser permission and creates a real Web Push subscription
 */
export async function subscribeToPush(
  userId: string,
  isDemo = false
): Promise<{
  success: boolean;
  permission: PushPermissionStatus;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      permission: 'unsupported',
      error: 'Push notifications are not supported on this browser or device.',
    };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission: permission as PushPermissionStatus,
        error: permission === 'denied' ? 'Notifications are blocked in browser settings.' : 'Permission was dismissed.',
      };
    }

    // 2. Ensure Service Worker is ready
    const registration = await registerServiceWorker();
    if (!registration) {
      return {
        success: false,
        permission: 'granted',
        error: 'Service Worker failed to initialize.',
      };
    }

    const vapidKey = getVapidPublicKey();

    // In demo mode or if VAPID key is not configured, record in localStorage
    if (isDemo || !vapidKey) {
      localStorage.setItem('breaktym_push_enabled', 'true');
      console.log('[BreakTym Push] Notifications enabled (Demo or local mode).');
      return {
        success: true,
        permission: 'granted',
      };
    }

    // 3. Subscribe with PushManager using the public VAPID key
    const applicationServerKey = urlBase64ToUint8Array(vapidKey) as unknown as BufferSource;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const rawJson = subscription.toJSON();
    const endpoint = subscription.endpoint;
    const p256dh = rawJson.keys?.p256dh || '';
    const auth = rawJson.keys?.auth || '';

    // 4. Save subscription securely to Supabase
    if (supabase && userId && !isDemo) {
      try {
        // Try secure RPC upsert_push_subscription first
        const { error: rpcError } = await (supabase.rpc as any)('upsert_push_subscription', {
          input_endpoint: endpoint,
          input_p256dh: p256dh,
          input_auth: auth,
          input_user_agent: navigator.userAgent,
        });

        if (rpcError) {
          // Direct table upsert fallback
          await supabase
            .from('push_subscriptions')
            .upsert(
              {
                user_id: userId,
                endpoint,
                p256dh,
                auth,
                user_agent: navigator.userAgent,
                disabled_at: null,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'endpoint' }
            );
        }
      } catch (dbErr) {
        console.warn('[BreakTym Push] Notice: Could not sync subscription to backend:', dbErr);
      }
    }

    localStorage.setItem('breaktym_push_enabled', 'true');
    return {
      success: true,
      permission: 'granted',
      subscription,
    };
  } catch (err: any) {
    console.error('[BreakTym Push] Subscription error:', err);
    return {
      success: false,
      permission: getNotificationPermission(),
      error: err?.message || 'Failed to subscribe to push notifications.',
    };
  }
}

/**
 * Unsubscribes from push notifications and marks subscription disabled in Supabase
 */
export async function unsubscribeFromPush(
  userId: string,
  isDemo = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getExistingPushSubscription();
    if (existing) {
      const endpoint = existing.endpoint;
      await existing.unsubscribe();

      if (supabase && userId && !isDemo) {
        try {
          await (supabase.rpc as any)('deactivate_push_subscription', {
            input_endpoint: endpoint,
          });
        } catch {
          await supabase
            .from('push_subscriptions')
            .update({ disabled_at: new Date().toISOString() })
            .eq('endpoint', endpoint)
            .eq('user_id', userId);
        }
      }
    }

    localStorage.removeItem('breaktym_push_enabled');
    return { success: true };
  } catch (err: any) {
    console.warn('[BreakTym Push] Error unsubscribing:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Synchronizes existing push subscription after login
 */
export async function syncExistingSubscription(userId: string, isDemo = false): Promise<void> {
  if (!userId || isDemo || !isPushNotificationSupported()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  try {
    const subscription = await getExistingPushSubscription();
    if (subscription && supabase) {
      const rawJson = subscription.toJSON();
      const endpoint = subscription.endpoint;
      const p256dh = rawJson.keys?.p256dh || '';
      const auth = rawJson.keys?.auth || '';

      if (endpoint && p256dh && auth) {
        const { error } = await (supabase.rpc as any)('upsert_push_subscription', {
          input_endpoint: endpoint,
          input_p256dh: p256dh,
          input_auth: auth,
          input_user_agent: navigator.userAgent,
        });

        if (error) {
          await supabase.from('push_subscriptions').upsert(
            {
              user_id: userId,
              endpoint,
              p256dh,
              auth,
              user_agent: navigator.userAgent,
              disabled_at: null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'endpoint' }
          );
        }
      }
    }
  } catch (err) {
    console.warn('[BreakTym Push] Failed to sync subscription after login:', err);
  }
}

/**
 * Invokes the server-side Supabase Edge Function to deliver real Web Push
 */
export async function triggerPushNotification(
  type: 'new_invitation' | 'invitation_accepted',
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !invitationId) {
    return { success: false, error: 'Supabase client or invitation ID unavailable.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        type,
        invitation_id: invitationId,
      },
    });

    if (error) {
      console.warn('[BreakTym Push] Edge Function returned notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, ...data };
  } catch (err: any) {
    console.warn('[BreakTym Push] Error invoking send-push-notification Edge Function:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Displays an in-browser notification when the app is active in foreground
 */
export async function showBrowserNotification(
  title: string,
  optionsOrBody: string | { body?: string; tag?: string; url?: string },
  url = '/'
): Promise<void> {
  if (!isPushNotificationSupported()) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const body = typeof optionsOrBody === 'string' ? optionsOrBody : optionsOrBody.body || '';
  const tag = typeof optionsOrBody === 'object' ? optionsOrBody.tag : undefined;
  const targetUrl = typeof optionsOrBody === 'object' && optionsOrBody.url ? optionsOrBody.url : url;

  try {
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

    new Notification(title, {
      body,
      tag,
      icon: '/icon.svg',
    });
  } catch (err) {
    console.warn('[BreakTym Push] Error showing browser notification:', err);
  }
}
