import { proxy as _proxy } from '../src/proxy';

type MockResponse = { kind: string; status: number; url?: string };
const proxy = _proxy as unknown as (req: unknown) => Promise<MockResponse>;

const mockAuth = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: (fn: (auth: unknown, req: unknown) => unknown) =>
    (req: unknown) => fn(() => mockAuth(), req),
}));

jest.mock('../src/lib/e2e-auth', () => ({
  getE2EAdminSession: jest.fn(() => null),
  getE2EUserSession: jest.fn(() => null),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    redirect: (url: URL) => ({ kind: 'redirect', status: 307, url: url.toString() }),
    next: () => ({ kind: 'next', status: 200 }),
  },
}));

describe('proxy', () => {
  const createRequest = (pathname: string, options?: { host?: string }) => {
    const host = options?.host ?? 'skillogue.test';
    const baseUrl = 'https://' + host + pathname;
    return {
      nextUrl: {
        pathname,
        clone: () => {
          const u = { pathname, _host: host };
          Object.defineProperty(u, 'pathname', { writable: true, value: pathname });
          return {
            get pathname() { return (u as any)._pathname || pathname; },
            set pathname(v: string) { (u as any)._pathname = v; },
            toString() { return 'https://' + host + ((u as any)._pathname || pathname); },
          };
        },
      },
      url: baseUrl,
      headers: { get: jest.fn() },
    } as never;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
  });

  it('redirects unauthenticated users away from protected routes', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await proxy(createRequest('/dashboard'));
    expect(response!.kind).toBe('redirect');
    expect(response!.url).toContain('/login');
  });

  it('redirects authenticated users away from auth routes', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    const response = await proxy(createRequest('/login'));
    expect(response!.kind).toBe('redirect');
    expect(response!.url).toContain('/dashboard');
  });

  it('redirects authenticated users away from the home route', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    const response = await proxy(createRequest('/'));
    expect(response!.kind).toBe('redirect');
    expect(response!.url).toContain('/dashboard');
  });

  it('allows unauthenticated access to public routes', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await proxy(createRequest('/faq'));
    expect(response!.kind).toBe('next');
  });

  it('allows authenticated access to protected routes', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    const response = await proxy(createRequest('/dashboard'));
    expect(response!.kind).toBe('next');
  });
});
