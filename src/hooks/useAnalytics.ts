import { usePathname } from 'next/navigation';
import { trackAnalyticsEvent } from '../lib/analytics';

export const useAnalytics = () => {
  const pathname = usePathname();

  const trackEvent = async (eventName: string, properties: Record<string, unknown> = {}) => {
    await trackAnalyticsEvent(eventName, properties, { path: pathname });
  };

  return { trackEvent };
};
