export {};

const mockAuth = jest.fn();
const mockCurrentUser = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  currentUser: () => mockCurrentUser(),
}));

jest.mock('../../src/lib/admin', () => ({
  isAdminEmail: jest.fn(() => false),
}));

jest.mock('../../src/lib/e2e-auth', () => ({
  getE2EAdminSession: jest.fn(() => null),
  getE2EUserSession: jest.fn(() => null),
}));

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: (init && init.status) || 200, json: async () => body }),
  },
}));

describe('/api/auth/session route', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routeHandlers: any;

  const createRequest = () => ({
    url: 'https://skillogue.test/api/auth/session',
    headers: { get: jest.fn((name) => (name === 'user-agent' ? 'jest-test' : null)) },
  });

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/session/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ userId: null });
    mockCurrentUser.mockResolvedValue(null);
  });

  it('returns null session when not authenticated', async () => {
    const response = await routeHandlers.GET(createRequest());
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
    const response = await routeHandlers.GET(createRequest());
    const body = await response.json();
    expect(body.session.user.id).toBe('user-123');
    expect(body.session.user.name).toBe('John Doe');
  });

  it('returns null session when userId exists but currentUser is null', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    const response = await routeHandlers.GET(createRequest());
    const body = await response.json();
    expect(body.session).toBeNull();
  });

  it('returns e2e session when e2e header present', async () => {
    const { getE2EAdminSession } = require('../../src/lib/e2e-auth');
    getE2EAdminSession.mockReturnValueOnce({ user: { id: 'e2e-user', email: 'a@b.com', isAdmin: true }, expires: null });
    const response = await routeHandlers.GET(createRequest());
    const body = await response.json();
    expect(body.session.user.id).toBe('e2e-user');
    expect(mockAuth).not.toHaveBeenCalled();
  });
});
