export {};

const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

jest.mock('../../src/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => null),
}));

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: (init && init.status) || 200, json: async () => body }),
  },
}));

jest.mock('../../src/lib/admin', () => ({
  isAdminEmail: jest.fn(() => false),
}));

describe('/api/auth/[...all] route', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routeHandlers: any;

  const createRequest = (body?: unknown) => ({
    headers: { get: jest.fn((name) => (name === 'user-agent' ? 'jest-test' : null)) },
    json: jest.fn().mockResolvedValue(body),
    nextUrl: { pathname: '/api/auth/test' },
  });

  const routeParams = (route: string) => ({
    params: Promise.resolve({ all: route.split('/') }),
  });

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/[...all]/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
  });

  it('returns null session when not authenticated (GET session)', async () => {
    const response = await routeHandlers.GET(createRequest(), routeParams('session'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.session).toBeNull();
  });

  it('returns session data when authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    mockCurrentUser.mockResolvedValue({
      id: 'user-123',
      primaryEmailAddressId: 'email-1',
      emailAddresses: [{ id: 'email-1', emailAddress: 'user@example.com' }],
      firstName: 'John',
      lastName: 'Doe',
    });
    const response = await routeHandlers.GET(createRequest(), routeParams('session'));
    const body = await response.json();
    expect(body.session.user.id).toBe('user-123');
    expect(body.session.user.email).toBe('user@example.com');
  });

  it('returns 404 for unknown GET routes', async () => {
    const response = await routeHandlers.GET(createRequest(), routeParams('unknown'));
    expect(response.status).toBe(404);
  });

  it('returns 410 for deprecated POST sign-in', async () => {
    const response = await routeHandlers.POST(createRequest(), routeParams('sign-in/email'));
    expect(response.status).toBe(410);
  });

  it('returns 410 for deprecated POST sign-up', async () => {
    const response = await routeHandlers.POST(createRequest(), routeParams('sign-up/email'));
    expect(response.status).toBe(410);
  });

  it('returns 410 for deprecated POST reset-password', async () => {
    const response = await routeHandlers.POST(createRequest(), routeParams('reset-password'));
    expect(response.status).toBe(410);
  });

  it('returns 410 for DELETE', async () => {
    const response = await routeHandlers.DELETE(createRequest(), {});
    expect(response.status).toBe(410);
  });
});
