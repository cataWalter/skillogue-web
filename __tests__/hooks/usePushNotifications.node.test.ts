/** @jest-environment node */

jest.mock('react', () => ({
  useState: jest.fn((initialState: unknown) => [initialState, jest.fn()]),
  useEffect: jest.fn((effect: () => void) => effect()),
}));

jest.mock('../../src/lib/analytics', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

import { usePushNotifications } from '../../src/hooks/usePushNotifications';

describe('usePushNotifications in a windowless environment', () => {
  it('treats push notifications as unsupported when window is unavailable', () => {
    const hook = usePushNotifications();

    expect(hook.isSupported).toBe(false);
  });
});
