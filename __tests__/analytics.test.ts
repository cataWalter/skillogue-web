import { trackAnalyticsEvent } from '../src/lib/analytics';

describe('trackAnalyticsEvent', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: originalFetch,
      writable: true,
    });
  });

  it('trims inputs and posts the current path when one is provided', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchSpy,
      writable: true,
    });

    await trackAnalyticsEvent('  page_view  ', { source: 'dashboard' }, { path: ' /custom-path ' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'page_view',
        properties: { source: 'dashboard' },
        path: '/custom-path',
      }),
    });
  });

  it('falls back to window location and ignores blank event names', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchSpy,
      writable: true,
    });

    await trackAnalyticsEvent('   ', { ignored: true });
    expect(fetchSpy).not.toHaveBeenCalled();

    await trackAnalyticsEvent('favorite_added', { source: 'profile' }, { path: '   ' });

    expect(fetchSpy).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({
      method: 'POST',
    }));

    const body = JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.path).toBe('/');
    expect(body.eventName).toBe('favorite_added');
  });

  it('logs fetch failures instead of throwing', async () => {
    const fetchSpy = jest.fn().mockRejectedValue(new Error('network down'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    Object.defineProperty(global, 'fetch', {
      configurable: true,
      value: fetchSpy,
      writable: true,
    });

    await trackAnalyticsEvent('message_sent', { source: 'chat' });

    expect(consoleSpy).toHaveBeenCalledWith('Error tracking event:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});