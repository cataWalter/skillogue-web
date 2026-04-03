import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './useAuth';

export const useAnalytics = () => {
  const { user } = useAuth();
  const pathname = usePathname();

  const trackEvent = async (eventName: string, properties: Record<string, unknown> = {}) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName,
          properties,
          path: pathname,
        }),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  useEffect(() => {
    if (pathname) {
      trackEvent('page_view', { path: pathname });
    }
  }, [pathname]);

  return { trackEvent };
};