import {
  clearAppwriteSessionCookie,
  createAppwriteAdminUsers,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
  getAppwriteErrorStatus,
  getAppwriteSessionSecret,
} from '../../src/lib/appwrite/server';
import { AppDataService } from '../../src/lib/server/app-data-service';

jest.mock('../../src/lib/appwrite/server', () => ({
  clearAppwriteSessionCookie: jest.fn(),
  createAppwriteAdminUsers: jest.fn(),
  createAppwriteSessionAccount: jest.fn(),
  getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback
  ),
  getAppwriteErrorStatus: jest.fn((error: { code?: number } | undefined, fallback = 500) =>
    typeof error?.code === 'number' ? error.code : fallback
  ),
  getAppwriteSessionSecret: jest.fn(),
}));

jest.mock('../../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
      cookies: {
        set: jest.fn(),
      },
    }),
  },
}));

describe('/api/auth/account route', () => {
  const deleteProfile = jest.fn();
  const deleteUser = jest.fn();
  let routeHandlers: typeof import('../../src/app/api/auth/account/route');

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/account/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    deleteProfile.mockResolvedValue(undefined);
    deleteUser.mockResolvedValue(undefined);

    (getAppwriteSessionSecret as jest.Mock).mockReturnValue('session-secret');
    (createAppwriteSessionAccount as jest.Mock).mockReturnValue({
      get: jest.fn().mockResolvedValue({ $id: 'user-123' }),
    });
    (createAppwriteAdminUsers as jest.Mock).mockReturnValue({
      delete: deleteUser,
    });
    (AppDataService as jest.Mock).mockImplementation(() => ({
      deleteProfile,
    }));
  });

  it('handles account deletion via DELETE', async () => {
    const request = {
      headers: {
        get: jest.fn((name: string) => (name === 'user-agent' ? 'jest-test' : null)),
      },
    };

    const response = await routeHandlers.DELETE(request as never);

    expect(getAppwriteSessionSecret).toHaveBeenCalledWith(request);
    expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', 'jest-test');
    expect(AppDataService).toHaveBeenCalledWith('session-secret', 'jest-test');
    expect(deleteProfile).toHaveBeenCalledWith('user-123');
    expect(deleteUser).toHaveBeenCalledWith('user-123');
    expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('returns 401 when no session cookie is present', async () => {
    (getAppwriteSessionSecret as jest.Mock).mockReturnValue(undefined);

    const request = {
      headers: {
        get: jest.fn(() => null),
      },
    };

    const response = await routeHandlers.DELETE(request as never);

    expect(createAppwriteSessionAccount).not.toHaveBeenCalled();
    expect(AppDataService).not.toHaveBeenCalled();
    expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Not authenticated.' });
  });

  it('keeps POST mapped to the same deletion handler for compatibility', () => {
    expect(routeHandlers.POST).toBe(routeHandlers.DELETE);
  });

  it('returns the mapped Appwrite error on failure', async () => {
    const failure = Object.assign(new Error('Delete failed'), { code: 503 });
    deleteProfile.mockRejectedValue(failure);

    const request = {
      headers: {
        get: jest.fn((name: string) => (name === 'user-agent' ? 'jest-test' : null)),
      },
    };

    const response = await routeHandlers.DELETE(request as never);

    expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 500);
    expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to delete account.');
    expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ message: 'Delete failed' });
  });
});