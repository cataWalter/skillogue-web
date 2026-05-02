import { useState, useEffect } from 'react';

type PushSupportOverride = 'supported' | 'unsupported';

const decodeVapidKey = (value: string) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawValue = atob(base64);

  return Uint8Array.from(rawValue, (character) => character.charCodeAt(0));
};

const ensureServiceWorkerRegistration = async () => {
  const existingRegistration = await navigator.serviceWorker.getRegistration();

  if (existingRegistration) {
    return existingRegistration;
  }

  await navigator.serviceWorker.register('/sw.js');

  // ready does not resolve until the registration becomes active.
  return navigator.serviceWorker.ready;
};

const getClientVapidKey = () =>
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_KEY;

const getVapidKey = async () => {
  const clientVapidKey = getClientVapidKey();

  if (clientVapidKey) {
    return clientVapidKey;
  }

  const response = await fetch('/api/push-subscription');

  if (!response.ok) {
    throw new Error('Failed to load push notification configuration.');
  }

  const payload = (await response.json()) as { publicKey?: string };

  if (typeof payload.publicKey === 'string' && payload.publicKey.length > 0) {
    return payload.publicKey;
  }

  return null;
};

const getPushSupportOverride = (): PushSupportOverride | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const override = (
    window as Window & {
      __SKILLOGUE_PUSH_SUPPORT_OVERRIDE__?: PushSupportOverride;
    }
  ).__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__;

  return override === 'supported' || override === 'unsupported' ? override : null;
};

const supportsPushNotifications = () => {
  const override = getPushSupportOverride();

  if (override === 'supported') {
    return true;
  }

  if (override === 'unsupported') {
    return false;
  }

  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supported = supportsPushNotifications();
    setIsSupported(supported);

    if (!supported) {
      setLoading(false);
      return;
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) {
        setLoading(false);
        return undefined;
      }
      return registration.pushManager.getSubscription();
    }).then((existing) => {
      if (existing) {
        setSubscription(existing);
      }
    }).catch((error) => {
      console.error('Error reading existing push subscription:', error);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const requestPermission = async () => {
    if (!isSupported || loading) return;

    let vapidKey: string | null;

    try {
      vapidKey = await getVapidKey();
    } catch (error) {
      console.error('Error loading push notification configuration:', error);
      return;
    }

    if (!vapidKey) {
      console.error(
        'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY, NEXT_PUBLIC_VAPID_KEY, or server VAPID_PUBLIC_KEY for push notifications.'
      );
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    try {
      setLoading(true);
      const registration = await ensureServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      const sub = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(vapidKey),
      });

      const json = sub.toJSON();
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      if (!response.ok) {
        throw new Error('Failed to save push subscription.');
      }

      setSubscription(sub);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from server
      await fetch('/api/push-subscription', { method: 'DELETE' });
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }
  };

  // Alias requestPermission as subscribe for easier use in components
  const subscribe = requestPermission;

  return {
    isSupported,
    subscription,
    loading,
    subscribe,
    requestPermission,
    unsubscribe,
  };
};
