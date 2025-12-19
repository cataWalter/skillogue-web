import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    } else {
      setLoading(false);
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !VAPID_PUBLIC_KEY) {
        console.error('Push notifications not supported or VAPID key missing');
        return;
    }

    try {
      setLoading(true);
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      setSubscription(sub);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const p256dh = sub.getKey('p256dh');
        const auth = sub.getKey('auth');
        
        if (p256dh && auth) {
            await supabase.from('push_subscriptions').upsert({
              user_id: user.id,
              endpoint: sub.endpoint,
              p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh) as any)),
              auth: btoa(String.fromCharCode.apply(null, new Uint8Array(auth) as any)),
            }, { onConflict: 'user_id, endpoint' });
        }
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;

    try {
      setLoading(true);
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').delete().match({ 
            user_id: user.id,
            endpoint: subscription.endpoint 
        });
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    } finally {
      setLoading(false);
    }
  }, [subscription]);

  return {
    isSupported,
    subscription,
    subscribe,
    unsubscribe,
    loading
  };
}
