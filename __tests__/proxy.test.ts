import { proxy } from '../src/proxy';

jest.mock('../src/lib/appwrite/config', () => ({
  getAppwriteSessionCookieName: jest.fn(() => 'a_session_skillogue'),
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
  const mockFetch = jest.fn();

  const createRequest = (pathname: string, sessionToken?: string) => ({
    cookies: {
      get: jest.fn((name: string) =>
        name === 'a_session_skillogue' && sessionToken ? { value: sessionToken } : undefined
      ),
    },
    headers: {
      get: jest.fn((name: string) => {
        if (name === 'cookie' && sessionToken) {
          return `a_session_skillogue=${sessionToken}`;
        }

        if (name === 'user-agent') {
          return 'jest-test';
        }

        return null;
      }),
    },
    nextUrl: {
      pathname,
      clone: () => new URL(`https://skillogue.test${pathname}`),
    },
    url: `https://skillogue.test${pathname}`,
  }) as never;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  it('redirects protected routes to login when there is no session cookie', async () => {
    const response = await proxy(createRequest('/dashboard'));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
  });

  it('redirects protected routes to login when the session is unverified', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ session: null }),
    });

    const response = await proxy(createRequest('/settings', 'session-secret'));

    expect(mockFetch).toHaveBeenCalledWith(new URL('/api/auth/session', 'https://skillogue.test/settings'), {
      headers: {
        cookie: 'a_session_skillogue=session-secret',
        'user-agent': 'jest-test',
      },
      cache: 'no-store',
    });
    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/login',
    });
  });

  it('allows auth routes when a session cookie exists but the session is unverified', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ session: null }),
    });

    const response = await proxy(createRequest('/login', 'session-secret'));

    expect(response).toEqual({
      kind: 'next',
      status: 200,
    });
  });

  it('redirects auth routes away only for verified sessions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        session: {
          user: {
            id: 'user-123',
          },
        },
      }),
    });

    const response = await proxy(createRequest('/login', 'session-secret'));

    expect(response).toEqual({
      kind: 'redirect',
      status: 307,
      url: 'https://skillogue.test/dashboard',
    });
  });
});