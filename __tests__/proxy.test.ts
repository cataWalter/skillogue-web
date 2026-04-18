import { proxy } from '../src/proxy';
import { getCurrentUserFromRequest } from '../src/lib/server/current-user';
import { AppwriteRepository } from '../src/lib/server/appwrite-repo';

jest.mock('../src/lib/appwrite/config', () => ({
  getAppwriteSessionCookieName: jest.fn(() => 'a_session_skillogue'),
}));

jest.mock('../src/lib/server/current-user', () => ({
  getCurrentUserFromRequest: jest.fn(),
}));

const mockListDocuments = jest.fn();

jest.mock('../src/lib/server/appwrite-repo', () => ({
  AppwriteRepository: jest.fn().mockImplementation(() => ({
    listDocuments: mockListDocuments,
  })),
}));

jest.mock('node-appwrite', () => ({
  Query: {
    equal: jest.fn((field: string, value: string) => `equal:${field}:${value}`),
    limit: jest.fn((value: number) => `limit:${value}`),
  },
}));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => ({
      kind: 'redirect',
      status: 307,
      url: url.toString(),
    }),
    next: () => ({
      kind: 'next',
      status: 200,
    }),
  },
}));

describe('proxy', () => {
  const mockedGetCurrentUserFromRequest = getCurrentUserFromRequest as jest.MockedFunction<typeof getCurrentUserFromRequest>;
  const MockedAppwriteRepository = AppwriteRepository as jest.MockedClass<typeof AppwriteRepository>;

  const createRequest = (
    pathname: string,
    sessionToken?: string,
    options?: {
      extraCookies?: Record<string, string>;
      extraHeaders?: Record<string, string>;
      host?: string;
      userAgent?: string | null;
    }
  ) => {
    const host = options?.host ?? 'skillogue.test';
    const cookies = new Map<string, string>();

    if (sessionToken) {
      cookies.set('a_session_skillogue', sessionToken);
    }

    for (const [name, value] of Object.entries(options?.extraCookies ?? {})) {
      cookies.set(name, value);
    }

    return {
      cookies: {
        get: jest.fn((name: string) => {
          const value = cookies.get(name);
          return value ? { value } : undefined;
        }),
      },
      headers: {
        get: jest.fn((name: string) => {
          if (name === 'cookie') {
            return cookies.size > 0
              ? Array.from(cookies.entries())
                  .map(([cookieName, cookieValue]) => `${cookieName}=${cookieValue}`)
                  .join('; ')
              : null;
          }

          if (name === 'user-agent') {
            return options?.userAgent === undefined ? 'jest-test' : options.userAgent;
          }

          return options?.extraHeaders?.[name] ?? null;
        }),
      },
      nextUrl: {
        hostname: host,
        pathname,
        clone: () => new URL(`https://${host}${pathname}`),
      },
      url: `https://${host}${pathname}`,
    } as never;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUserFromRequest.mockReset();
    mockListDocuments.mockReset();
  });

  it('redirects protected routes to login when there is no session cookie', async () => {
    const response = await proxy(createRequest('/dashboard'));

    expect(mockedGetCurrentUserFromRequest).not.toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
  });

  it('redirects admin, favorites, and notifications routes to login when there is no session cookie', async () => {
    const adminResponse = await proxy(createRequest('/admin/verification'));
    const favoritesResponse = await proxy(createRequest('/favorites'));
    const notificationsResponse = await proxy(createRequest('/notifications'));

    expect(mockedGetCurrentUserFromRequest).not.toHaveBeenCalled();
    expect(adminResponse).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
    expect(favoritesResponse).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
    expect(notificationsResponse).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
  });

  it('redirects protected routes to login when the session is unverified', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue(null);

    const response = await proxy(createRequest('/settings', 'session-secret'));

    expect(mockedGetCurrentUserFromRequest).toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
  });

  it('allows auth routes when a session cookie exists but the session is unverified', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue(null);

    const response = await proxy(createRequest('/login', 'session-secret'));

    expect(response).toEqual({
      kind: 'next',
      status: 200,
    });
  });

  it('redirects auth routes away only for verified sessions', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({
      documents: [{ id: 'user-123', first_name: 'Ada' }],
    });

    const response = await proxy(createRequest('/login', 'session-secret'));

    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/dashboard',
    });
  });

  it('redirects the home route to dashboard for verified sessions', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({
      documents: [{ id: 'user-123', first_name: 'Ada' }],
    });

    const response = await proxy(createRequest('/', 'session-secret'));

    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/dashboard',
    });
  });

  it('redirects protected routes to onboarding when the logged-in profile is incomplete', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({ documents: [] });

    const response = await proxy(createRequest('/messages', 'session-secret'));

    expect(MockedAppwriteRepository).toHaveBeenCalledWith(undefined, 'jest-test');
    expect(mockListDocuments).toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/onboarding',
    });
  });

  it('redirects favorites to onboarding when the logged-in profile is incomplete', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({ documents: [] });

    const response = await proxy(createRequest('/favorites', 'session-secret'));

    expect(MockedAppwriteRepository).toHaveBeenCalledWith(undefined, 'jest-test');
    expect(mockListDocuments).toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/onboarding',
    });
  });

  it('allows onboarding for logged-in users with incomplete profiles', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({
      documents: [{ id: 'user-123', first_name: '' }],
    });

    const response = await proxy(createRequest('/onboarding', 'session-secret'));

    expect(response).toEqual({
      kind: 'next',
      status: 200,
    });
  });

  it('redirects auth routes to onboarding when the logged-in profile is incomplete', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({
      documents: [{ id: 'user-123', first_name: null }],
    });

    const response = await proxy(createRequest('/login', 'session-secret'));

    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/onboarding',
    });
  });

  it('redirects the home route to onboarding when the logged-in profile is incomplete', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockResolvedValue({
      documents: [{ id: 'user-123', first_name: null }],
    });

    const response = await proxy(createRequest('/', 'session-secret'));

    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/onboarding',
    });
  });

  it('allows protected routes when profile completion cannot be determined', async () => {
    mockedGetCurrentUserFromRequest.mockResolvedValue({ id: 'user-123', email: 'ada@example.com' });
    mockListDocuments.mockRejectedValueOnce(new Error('repository unavailable'));

    const response = await proxy(
      createRequest('/dashboard', 'session-secret', {
        userAgent: null,
      })
    );

    expect(MockedAppwriteRepository).toHaveBeenCalledWith(undefined, undefined);
    expect(response).toEqual({
      kind: 'next',
      status: 200,
    });
  });

  it('treats local e2e admin sessions as authenticated without user lookup', async () => {
    const response = await proxy(
      createRequest('/login', undefined, {
        host: 'localhost',
        extraCookies: {
          skillogue_e2e_auth: 'admin',
        },
        extraHeaders: {
          'x-skillogue-e2e-auth': 'admin',
        },
      })
    );

    expect(mockedGetCurrentUserFromRequest).not.toHaveBeenCalled();
    expect(MockedAppwriteRepository).not.toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://localhost/dashboard',
    });
  });
});
