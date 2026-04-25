import {
  clearAppwriteSessionCookie,
  createAppwriteSessionAccount,
  getAppwriteSessionSecret,
} from '../../src/lib/appwrite/server';

jest.mock('../../src/lib/appwrite/server', () => ({
  clearAppwriteSessionCookie: jest.fn(),
  createAppwriteSessionAccount: jest.fn(),
  getAppwriteSessionSecret: jest.fn(),
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

describe('/api/auth/session route', () => {
  const getUser = jest.fn();
  const getSession = jest.fn();
  let routeHandlers: typeof import('../../src/app/api/auth/session/route');

  const createRequest = () =>
    ({
      headers: {
        get: jest.fn((name: string) => (name === 'user-agent' ? 'jest-test' : null)),
      },
    }) as never;

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/session/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();

    getUser.mockResolvedValue({
      $id: 'user-123',
      email: 'user@example.com',
      name: 'User',
      emailVerification: true,
    });
    getSession.mockResolvedValue({
      expire: '2026-12-31T00:00:00.000Z',
    });

    (getAppwriteSessionSecret as jest.Mock).mockReturnValue('session-secret');
    (createAppwriteSessionAccount as jest.Mock).mockReturnValue({
      get: getUser,
      getSession,
    });
  });

  it('returns null when no session cookie is present', async () => {
    (getAppwriteSessionSecret as jest.Mock).mockReturnValue(undefined);

    const response = await routeHandlers.GET(createRequest());

    expect(createAppwriteSessionAccount).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ session: null });
  });

  it('returns the session payload for verified users', async () => {
    const response = await routeHandlers.GET(createRequest());

    expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', 'jest-test');
    expect(clearAppwriteSessionCookie).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      session: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'User',
        },
        expires: '2026-12-31T00:00:00.000Z',
      },
    });
  });

  it('clears the local cookie when session restoration fails', async () => {
    getUser.mockRejectedValueOnce(new Error('session expired'));

    const response = await routeHandlers.GET(createRequest());

    expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
    await expect(response.json()).resolves.toEqual({ session: null });
  });
});