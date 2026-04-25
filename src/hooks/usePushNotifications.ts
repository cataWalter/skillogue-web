import { useState, useEffect } from 'react';

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

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported || loading) return;

    const vapidKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_VAPID_KEY;

    if (!vapidKey) {
      console.error(
        'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or NEXT_PUBLIC_VAPID_KEY for push notifications.'
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
