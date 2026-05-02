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

describe('/api/admin/settings route', () => {
    const getAdminSettings = jest.fn();
    const updateAdminSettings = jest.fn();
    let routeHandlers: typeof import('../../src/app/api/admin/settings/route');

    const createRequest = (url: string, body?: unknown) => ({
        url,
        headers: {
            get: jest.fn().mockReturnValue('jest'),
        },
        cookies: {
            get: jest.fn(),
        },
        json: jest.fn().mockResolvedValue(body),
    });

    beforeAll(async () => {
        routeHandlers = await import('../../src/app/api/admin/settings/route');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        getAdminSettings.mockResolvedValue({
            maintenanceBannerText: '',
            moderationHold: false,
            followUpUserIds: [],
            updatedAt: null,
        });
        updateAdminSettings.mockResolvedValue({
            maintenanceBannerText: 'Scheduled maintenance at 10pm UTC',
            moderationHold: true,
            followUpUserIds: ['user-1'],
            updatedAt: '2026-04-26T12:00:00.000Z',
        });
        (AppDataService as jest.Mock).mockImplementation(() => ({
            getAdminSettings,
            updateAdminSettings,
        }));
        (requireAdminRequest as jest.Mock).mockResolvedValue({
            ok: true,
            userAgent: 'jest',
        });
    });

    it('returns the current admin settings', async () => {
        const response = await routeHandlers.GET(createRequest('http://localhost/api/admin/settings') as any);

        expect(getAdminSettings).toHaveBeenCalled();
        await expect(response.json()).resolves.toEqual(
            expect.objectContaining({
                moderationHold: false,
            })
        );
    });

    it('returns the auth response when admin access is denied', async () => {
        const deniedResponse = { status: 403, json: async () => ({ error: 'Forbidden' }) };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({ response: deniedResponse });

        const response = await routeHandlers.GET(createRequest('http://localhost/api/admin/settings') as any);

        expect(AppDataService).not.toHaveBeenCalled();
        expect(response).toBe(deniedResponse);
    });

    it('returns a 500 response when loading settings fails', async () => {
        getAdminSettings.mockRejectedValueOnce(new Error('boom'));

        const response = await routeHandlers.GET(createRequest('http://localhost/api/admin/settings') as any);

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch admin settings' });
    });

    it('updates admin settings', async () => {
        const response = await routeHandlers.PATCH(
            createRequest('http://localhost/api/admin/settings', {
                maintenanceBannerText: 'Scheduled maintenance at 10pm UTC',
                moderationHold: true,
                followUpUserIds: ['user-1'],
            }) as any
        );

        expect(updateAdminSettings).toHaveBeenCalledWith({
            maintenanceBannerText: 'Scheduled maintenance at 10pm UTC',
            moderationHold: true,
            followUpUserIds: ['user-1'],
        });
        expect(response.status).toBe(200);
    });

    it('normalizes invalid patch values to undefined', async () => {
        await routeHandlers.PATCH(
            createRequest('http://localhost/api/admin/settings', {
                maintenanceBannerText: 123,
                moderationHold: 'yes',
                followUpUserIds: 'user-1',
            }) as any
        );

        expect(updateAdminSettings).toHaveBeenCalledWith({
            maintenanceBannerText: undefined,
            moderationHold: undefined,
            followUpUserIds: undefined,
        });
    });

    it('returns the auth response and catches patch failures', async () => {
        const deniedResponse = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({ response: deniedResponse });

        const denied = await routeHandlers.PATCH(createRequest('http://localhost/api/admin/settings', {}) as any);

        expect(denied).toBe(deniedResponse);

        updateAdminSettings.mockRejectedValueOnce(new Error('boom'));
        const response = await routeHandlers.PATCH(createRequest('http://localhost/api/admin/settings', {}) as any);

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to update admin settings' });
    });
});
