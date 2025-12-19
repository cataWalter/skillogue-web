import { useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();

  const trackEvent = useCallback(async (eventName: string, properties: Record<string, any> = {}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('analytics_events').insert({
        user_id: user?.id || null,
        event_name: eventName,
        properties,
        path: pathname
      });
    } catch (error) {
      // Fail silently for analytics
      console.warn('Analytics error:', error);
    }
  }, [pathname]);

  return { trackEvent };
}
