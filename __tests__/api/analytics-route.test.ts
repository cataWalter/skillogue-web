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

  const createRequest = (body: unknown) =>
    ({
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Request;

  const createInvalidJsonRequest = () =>
    ({
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON body')),
    }) as unknown as Request;

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
    const request = createRequest({
      eventName: 'page_view',
      properties: { source: 'test' },
      path: '/dashboard',
    });

    const response = await routeHandlers.POST(request);

    expect(trackAnalyticsEvent).toHaveBeenCalledWith({
      eventName: 'page_view',
      properties: { source: 'test' },
      path: '/dashboard',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('defaults properties to an empty object when they are omitted', async () => {
    const request = createRequest({
      eventName: 'page_view',
      path: '/dashboard',
    });

    const response = await routeHandlers.POST(request);

    expect(trackAnalyticsEvent).toHaveBeenCalledWith({
      eventName: 'page_view',
      properties: {},
      path: '/dashboard',
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('returns 500 when parsing the request body fails', async () => {
    const request = createInvalidJsonRequest();

    const response = await routeHandlers.POST(request);

    expect(AppDataService).not.toHaveBeenCalled();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid analytics payload.' });
  });

  it('returns 400 when required analytics fields are missing', async () => {
    const request = createRequest({ properties: { source: 'test' } });

    const response = await routeHandlers.POST(request);

    expect(AppDataService).not.toHaveBeenCalled();
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid analytics payload.' });
  });

  it('returns 500 when the analytics service throws', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = new Error('tracking failed');
    const request = createRequest({
      eventName: 'page_view',
      properties: { source: 'test' },
      path: '/dashboard',
    });
    trackAnalyticsEvent.mockRejectedValueOnce(failure);

    const response = await routeHandlers.POST(request);

    expect(trackAnalyticsEvent).toHaveBeenCalledWith({
      eventName: 'page_view',
      properties: { source: 'test' },
      path: '/dashboard',
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: 'Failed to track analytics' });
    expect(errorSpy).toHaveBeenCalledWith('Error tracking analytics:', failure);
    errorSpy.mockRestore();
  });
});
