/** @jest-environment node */

import { trackAnalyticsEvent } from '../src/lib/analytics';

describe('trackAnalyticsEvent (server)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
  });

  it('returns early when running without a window object', async () => {
    const fetchSpy = jest.fn();

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchSpy,
      writable: true,
    });

    await trackAnalyticsEvent('page_view', { source: 'server' });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
