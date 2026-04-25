import { usePathname } from 'next/navigation';

export const useAnalytics = () => {
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

  return { trackEvent };
};