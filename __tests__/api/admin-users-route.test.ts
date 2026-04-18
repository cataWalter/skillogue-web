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

describe('admin users routes', () => {
    const listAdminProfiles = jest.fn();
    const getAdminUserInvestigation = jest.fn();
    const sendAdminMessage = jest.fn();
    const sendAdminNotification = jest.fn();
    const setAdminUserVerified = jest.fn();
    const toggleAdminFollowUp = jest.fn();

    let usersRoute: typeof import('../../src/app/api/admin/users/route');
    let detailRoute: typeof import('../../src/app/api/admin/users/[id]/route');
    let actionsRoute: typeof import('../../src/app/api/admin/users/[id]/actions/route');

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
        usersRoute = await import('../../src/app/api/admin/users/route');
        detailRoute = await import('../../src/app/api/admin/users/[id]/route');
        actionsRoute = await import('../../src/app/api/admin/users/[id]/actions/route');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        listAdminProfiles.mockResolvedValue([{ id: 'user-1', displayName: 'Alice Example' }]);
        getAdminUserInvestigation.mockResolvedValue({ user: { id: 'user-1', displayName: 'Alice Example' } });
        sendAdminMessage.mockResolvedValue({ id: 'message-1' });
        sendAdminNotification.mockResolvedValue({ success: true });
        setAdminUserVerified.mockResolvedValue({ success: true });
        toggleAdminFollowUp.mockResolvedValue({ followUpUserIds: ['user-1'] });
        (AppDataService as jest.Mock).mockImplementation(() => ({
            listAdminProfiles,
            getAdminUserInvestigation,
            sendAdminMessage,
            sendAdminNotification,
            setAdminUserVerified,
            toggleAdminFollowUp,
        }));
        (requireAdminRequest as jest.Mock).mockResolvedValue({
            ok: true,
            user: { id: 'admin-1', email: 'admin@example.com' },
            userAgent: 'jest',
        });
    });

    it('lists searchable admin users', async () => {
        const response = await usersRoute.GET(createRequest('http://localhost/api/admin/users?query=alice') as any);

        expect(listAdminProfiles).toHaveBeenCalledWith({ query: 'alice', limit: 8 });
        await expect(response.json()).resolves.toEqual([{ id: 'user-1', displayName: 'Alice Example' }]);
    });

    it('passes through auth responses and handles list failures', async () => {
        const deniedResponse = { status: 403, json: async () => ({ error: 'Forbidden' }) };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({ response: deniedResponse });

        const denied = await usersRoute.GET(createRequest('http://localhost/api/admin/users') as any);

        expect(denied).toBe(deniedResponse);

        listAdminProfiles.mockRejectedValueOnce(new Error('boom'));
        const response = await usersRoute.GET(createRequest('http://localhost/api/admin/users') as any);

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch admin users' });
    });

    it('returns a detailed admin investigation payload', async () => {
        const response = await detailRoute.GET(createRequest('http://localhost/api/admin/users/user-1') as any, {
            params: Promise.resolve({ id: 'user-1' }),
        } as any);

        expect(getAdminUserInvestigation).toHaveBeenCalledWith('user-1');
        await expect(response.json()).resolves.toEqual({ user: { id: 'user-1', displayName: 'Alice Example' } });
    });

    it('passes through auth responses and handles investigation failures', async () => {
        const deniedResponse = { status: 401, json: async () => ({ error: 'Unauthorized' }) };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({ response: deniedResponse });

        const denied = await detailRoute.GET(createRequest('http://localhost/api/admin/users/user-1') as any, {
            params: Promise.resolve({ id: 'user-1' }),
        } as any);

        expect(denied).toBe(deniedResponse);

        getAdminUserInvestigation.mockRejectedValueOnce(new Error('boom'));
        const response = await detailRoute.GET(createRequest('http://localhost/api/admin/users/user-1') as any, {
            params: Promise.resolve({ id: 'user-1' }),
        } as any);

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch admin user investigation' });
    });

    it('sends an admin message', async () => {
        const response = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'send-message',
                content: 'Please update your verification documents.',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(sendAdminMessage).toHaveBeenCalledWith({
            adminUserId: 'admin-1',
            userId: 'user-1',
            content: 'Please update your verification documents.',
        });
        expect(response.status).toBe(200);
    });

    it('sends an admin notification and toggles follow-up', async () => {
        const notificationResponse = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'send-notification',
                title: '  Profile review  ',
                content: '  Please review your profile.  ',
                url: '/admin',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(sendAdminNotification).toHaveBeenCalledWith({
            adminUserId: 'admin-1',
            userId: 'user-1',
            title: 'Profile review',
            body: 'Please review your profile.',
            url: '/admin',
        });
        expect(notificationResponse.status).toBe(200);

        const followUpResponse = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'toggle-follow-up',
                followUp: true,
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(toggleAdminFollowUp).toHaveBeenCalledWith('user-1', true);
        expect(followUpResponse.status).toBe(200);
    });

    it('toggles admin verification state', async () => {
        const response = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'toggle-verification',
                verified: true,
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(setAdminUserVerified).toHaveBeenCalledWith('user-1', true);
        expect(response.status).toBe(200);
    });

    it('validates required admin action payloads', async () => {
        const response = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'send-notification',
                title: '',
                content: '',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(sendAdminNotification).not.toHaveBeenCalled();
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({ error: 'Notification title and body are required.' });
    });

    it('validates other admin action payloads and unsupported actions', async () => {
        const messageResponse = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'send-message',
                content: '   ',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );
        expect(messageResponse.status).toBe(400);
        await expect(messageResponse.json()).resolves.toEqual({ error: 'Message content is required.' });

        const verificationResponse = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'toggle-verification',
                verified: 'yes',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );
        expect(verificationResponse.status).toBe(400);
        await expect(verificationResponse.json()).resolves.toEqual({
            error: 'Verification toggle requires a boolean value.',
        });

        const followUpResponse = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'toggle-follow-up',
                followUp: 'yes',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );
        expect(followUpResponse.status).toBe(400);
        await expect(followUpResponse.json()).resolves.toEqual({
            error: 'Follow-up toggle requires a boolean value.',
        });

        const unsupported = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', {
                action: 'archive-user',
            }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );
        expect(unsupported.status).toBe(400);
        await expect(unsupported.json()).resolves.toEqual({ error: 'Unsupported admin action.' });
    });

    it('passes through auth responses and handles action failures', async () => {
        const deniedResponse = { status: 403, json: async () => ({ error: 'Forbidden' }) };
        (requireAdminRequest as jest.Mock).mockResolvedValueOnce({ response: deniedResponse });

        const denied = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', { action: 'send-message', content: 'Hello' }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(denied).toBe(deniedResponse);

        sendAdminMessage.mockRejectedValueOnce(new Error('boom'));
        const response = await actionsRoute.POST(
            createRequest('http://localhost/api/admin/users/user-1/actions', { action: 'send-message', content: 'Hello' }) as any,
            { params: Promise.resolve({ id: 'user-1' }) } as any
        );

        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Failed to perform admin action' });
    });
});