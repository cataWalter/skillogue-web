import {
  clearAppwriteSessionCookie,
  createAppwriteSessionAccount,
  getAppwriteSessionSecret,
} from '../../src/lib/appwrite/server';
import {
	E2E_AUTH_ADMIN_COOKIE_VALUE,
	E2E_AUTH_COOKIE_NAME,
	E2E_AUTH_HEADER_NAME,
} from '../../src/lib/e2e-auth';

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
      url: 'https://skillogue.test/api/auth/session',
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

  it('returns the e2e admin session for local allowlisted requests', async () => {
    const response = await routeHandlers.GET({
      url: 'http://localhost/api/auth/session',
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'user-agent') {
            return 'jest-test';
          }

          if (name === E2E_AUTH_HEADER_NAME) {
            return E2E_AUTH_ADMIN_COOKIE_VALUE;
          }

          return null;
        }),
      },
      cookies: {
        get: jest.fn((name: string) =>
          name === E2E_AUTH_COOKIE_NAME
            ? { value: E2E_AUTH_ADMIN_COOKIE_VALUE }
            : undefined
        ),
      },
    } as never);

    expect(getAppwriteSessionSecret).not.toHaveBeenCalled();
    expect(createAppwriteSessionAccount).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      session: {
        user: {
          id: 'e2e-admin',
          email: 'cata.walter@gmail.com',
          name: 'E2E Admin',
        },
        expires: '2099-01-01T00:00:00.000Z',
      },
    });
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

  it('omits the optional name and passes an undefined user agent when both are missing', async () => {
    getUser.mockResolvedValueOnce({
      $id: 'user-123',
      email: 'user@example.com',
      name: null,
    });

    const request = {
      url: 'https://skillogue.test/api/auth/session',
      headers: {
        get: jest.fn(() => null),
      },
    } as never;

    const response = await routeHandlers.GET(request);

    expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', undefined);
    await expect(response.json()).resolves.toEqual({
      session: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: undefined,
        },
        expires: '2026-12-31T00:00:00.000Z',
      },
    });
  });
});