import { AppDataService } from '../../src/lib/server/app-data-service';
import { requireAdminRequest } from '../../src/lib/server/admin-auth';

jest.mock('../../src/lib/server/app-data-service', () => ({
    AppDataService: jest.fn(),
}));

jest.mock('../../src/lib/server/admin-auth', () => ({
    requireAdminRequest: jest.fn(),
}));

jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: unknown, init?: { status?: number }) => ({
            status: init?.status ?? 200,
            json: async () => body,
        }),
    },
}));

describe('/api/admin/analytics route', () => {
    const getAdminDashboardSnapshot = jest.fn();
    const exportAdminAnalyticsEvents = jest.fn();
    let routeHandlers: typeof import('../../src/app/api/admin/analytics/route');

    const createRequest = (url = 'http://localhost/api/admin/analytics') => ({
        url,
        headers: {
            get: jest.fn().mockReturnValue('jest'),
        },
        cookies: {
            get: jest.fn(),
        },
    });

    beforeAll(async () => {
        routeHandlers = await import('../../src/app/api/admin/analytics/route');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        getAdminDashboardSnapshot.mockResolvedValue({
            analytics: {
                filters: {
                    eventType: null,
                    path: null,
                    availableEventTypes: [],
                    availablePaths: [],
                    exportUrl: '',
                },
            },
            queues: { reports: [], verificationRequests: [] },
            quickActions: {
                pendingReports: 1,
                pendingVerificationRequests: 2,
                flaggedUsers: 0,
                unreadNotifications: 3,
                totalQueueItems: 3,
            },
            systemControls: {
                maintenanceBannerText: '',
                analyticsRefreshMinutes: 15,
                moderationHold: false,
                followUpUserIds: [],
                updatedAt: null,
            },
            lastUpdatedAt: '2026-04-26T12:00:00.000Z',
        });
        exportAdminAnalyticsEvents.mockResolvedValue({ exportedAt: '2026-04-26T12:00:00.000Z', totalEvents: 4, events: [] });
        (AppDataService as jest.Mock).mockImplementation(() => ({
            getAdminDashboardSnapshot,
            exportAdminAnalyticsEvents,
        }));
        (requireAdminRequest as jest.Mock).mockResolvedValue({
            ok: true,
            userAgent: 'jest',
        });
    });

    it('returns admin analytics for an authorized admin request', async () => {
        const response = await routeHandlers.GET(createRequest() as any);

        expect(requireAdminRequest).toHaveBeenCalled();
        expect(AppDataService).toHaveBeenCalledWith(undefined, 'jest');
        expect(getAdminDashboardSnapshot).toHaveBeenCalledWith({ days: null, eventType: null, path: null });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                analytics: expect.objectContaining({
                    filters: expect.objectContaining({
                        exportUrl: '/api/admin/analytics?export=json',
                    }),
                }),
            })
        );
    });

    it('passes the requested filters to the dashboard service', async () => {
        await routeHandlers.GET(
            createRequest('http://localhost/api/admin/analytics?days=90&eventType=search_submitted&path=%2Fsearch') as any
        );

        expect(getAdminDashboardSnapshot).toHaveBeenCalledWith({
            days: 90,
            eventType: 'search_submitted',
            path: '/search',
        });
    });

    it('returns a filtered export payload when export mode is requested', async () => {
        const response = await routeHandlers.GET(
            createRequest('http://localhost/api/admin/analytics?days=30&eventType=page_view&export=json') as any
        );

        expect(exportAdminAnalyticsEvents).toHaveBeenCalledWith({
            days: 30,
            eventType: 'page_view',
            path: null,
        });
        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                exportedAt: '2026-04-26T12:00:00.000Z',
                totalEvents: 4,
            })
        );
    });

    it('returns the guard response when authorization fails', async () => {
        const forbiddenResponse = {
            status: 403,
            json: async () => ({ error: 'Forbidden.' }),
        };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({
            ok: false,
            response: forbiddenResponse,
        });

        const response = await routeHandlers.GET(createRequest() as any);

        expect(AppDataService).not.toHaveBeenCalled();
        expect(response).toBe(forbiddenResponse);
    });

    it('returns 500 when fetching analytics fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const failure = new Error('analytics failed');
        getAdminDashboardSnapshot.mockRejectedValueOnce(failure);

        const response = await routeHandlers.GET(createRequest() as any);

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch admin analytics' });
        expect(errorSpy).toHaveBeenCalledWith('Error fetching admin analytics:', failure);
        errorSpy.mockRestore();
    });
});
