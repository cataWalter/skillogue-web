import { AppDataService } from '../../src/lib/server/app-data-service';

jest.mock('../../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe('/api/analytics route', () => {
  const trackAnalyticsEvent = jest.fn();
  let routeHandlers: typeof import('../../src/app/api/analytics/route');

  const createRequest = (body: string) =>
    ({
      text: jest.fn().mockResolvedValue(body),
    }) as Request;

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/analytics/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    trackAnalyticsEvent.mockResolvedValue({ success: true });
    (AppDataService as jest.Mock).mockImplementation(() => ({
      trackAnalyticsEvent,
    }));
  });

  it('tracks valid analytics events', async () => {
    const request = createRequest(
      JSON.stringify({
        eventName: 'page_view',
        properties: { source: 'test' },
        path: '/dashboard',
      })
    );

    const response = await routeHandlers.POST(request);

    expect(trackAnalyticsEvent).toHaveBeenCalledWith({
      eventName: 'page_view',
      properties: { source: 'test' },
      path: '/dashboard',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('ignores empty request bodies without logging errors', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const request = createRequest('');

    const response = await routeHandlers.POST(request);

    expect(AppDataService).not.toHaveBeenCalled();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ success: true, ignored: true });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('returns 400 for invalid JSON payloads without invoking the service', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const request = createRequest('{');

    const response = await routeHandlers.POST(request);

    expect(AppDataService).not.toHaveBeenCalled();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});