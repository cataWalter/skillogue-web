import {
  buildAppUrl,
  createAppwriteAdminAccount,
  createAppwriteAdminUsers,
  createAppwriteSessionAccount,
  getAppwriteErrorMessage,
  getAppwriteErrorStatus,
  setAppwriteSessionCookie,
} from '../../src/lib/appwrite/server';

jest.mock('../../src/lib/appwrite/server', () => ({
  buildAppUrl: jest.fn((path: string) => `https://skillogue.test${path}`),
  clearAppwriteSessionCookie: jest.fn(),
  createAppwriteAdminAccount: jest.fn(),
  createAppwriteAdminUsers: jest.fn(),
  createAppwriteSessionAccount: jest.fn(),
  getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback
  ),
  getAppwriteErrorStatus: jest.fn((error: { code?: number } | undefined, fallback = 500) =>
    typeof error?.code === 'number' ? error.code : fallback
  ),
  setAppwriteSessionCookie: jest.fn(),
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

describe('/api/auth/[...all] route', () => {
  const createEmailPasswordSession = jest.fn();
  const getUser = jest.fn();
  const getUserById = jest.fn();
  const listUsers = jest.fn();
  const updatePassword = jest.fn();
  const deleteSession = jest.fn();
  const fetchMock = jest.fn();
  let routeHandlers: typeof import('../../src/app/api/auth/[...all]/route');

  const createRequest = (route: string, body: unknown) =>
    ({
      headers: {
        get: jest.fn((name: string) => (name === 'user-agent' ? 'jest-test' : null)),
      },
      json: jest.fn().mockResolvedValue(body),
      nextUrl: {
        pathname: `/api/auth/${route}`,
      },
    }) as never;

  const routeParams = (route: string) => ({
    params: Promise.resolve({ all: route.split('/') }),
  });

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/[...all]/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.BREVO_API_KEY = 'brevo-test-key';
    process.env.PASSWORD_RESET_TOKEN_SECRET = 'password-reset-secret';
    global.fetch = fetchMock as typeof fetch;

    createEmailPasswordSession.mockResolvedValue({
      secret: 'session-secret',
      expire: '2026-12-31T00:00:00.000Z',
    });
    getUser.mockResolvedValue({
      $id: 'user-123',
      email: 'user@example.com',
      name: 'User',
      emailVerification: true,
    });
    deleteSession.mockResolvedValue(undefined);
    listUsers.mockResolvedValue({
      users: [
        {
          $id: 'user-123',
          email: 'user@example.com',
          name: 'User',
          passwordUpdate: '2024-01-01T00:00:00.000Z',
        },
      ],
    });
    getUserById.mockResolvedValue({
      $id: 'user-123',
      email: 'user@example.com',
      name: 'User',
      passwordUpdate: '2024-01-01T00:00:00.000Z',
    });
    updatePassword.mockResolvedValue({
      $id: 'user-123',
      email: 'user@example.com',
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ messageId: 'email-123' }),
      statusText: 'OK',
    });

    (createAppwriteAdminAccount as jest.Mock).mockReturnValue({
      createEmailPasswordSession,
    });
    (createAppwriteAdminUsers as jest.Mock).mockReturnValue({
      get: getUserById,
      list: listUsers,
      updatePassword,
    });
    (createAppwriteSessionAccount as jest.Mock).mockReturnValue({
      get: getUser,
      deleteSession,
    });
  });

  afterEach(() => {
    delete process.env.BREVO_API_KEY;
    delete process.env.PASSWORD_RESET_TOKEN_SECRET;
  });

  it('signs in verified users and sets the session cookie', async () => {
    const request = createRequest('sign-in/email', {
      email: 'user@example.com',
      password: 'Password123#',
    });

    const response = await routeHandlers.POST(request, routeParams('sign-in/email'));

    expect(createAppwriteAdminAccount).toHaveBeenCalledWith('jest-test');
    expect(createEmailPasswordSession).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123#',
    });
    expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', 'jest-test');
    expect(deleteSession).not.toHaveBeenCalled();
    expect(setAppwriteSessionCookie).toHaveBeenCalledWith(
      response,
      'session-secret',
      '2026-12-31T00:00:00.000Z'
    );
    expect(response.status).toBe(200);
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

  it('rejects sign in when the user email is not verified', async () => {
    getUser.mockResolvedValue({
      $id: 'user-123',
      email: 'user@example.com',
      name: 'User',
      emailVerification: false,
    });

    const request = createRequest('sign-in/email', {
      email: 'user@example.com',
      password: 'Password123#',
    });

    const response = await routeHandlers.POST(request, routeParams('sign-in/email'));

    expect(deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
    expect(setAppwriteSessionCookie).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message:
        'Please verify your email before signing in. Check your inbox and wait to verify the email.',
    });
  });

  it('maps Appwrite sign-in failures to the API error response', async () => {
    const failure = Object.assign(new Error('Invalid credentials'), { code: 401 });
    createEmailPasswordSession.mockRejectedValue(failure);

    const request = createRequest('sign-in/email', {
      email: 'user@example.com',
      password: 'wrong-password',
    });

    const response = await routeHandlers.POST(request, routeParams('sign-in/email'));

    expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to sign in.');
    expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 401);
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: 'Invalid credentials' });
  });

  it('sends a branded password reset email with a signed reset link', async () => {
    const request = createRequest('reset-password', {
      email: 'user@example.com',
    });

    const response = await routeHandlers.POST(request, routeParams('reset-password'));

    expect(createAppwriteAdminUsers).toHaveBeenCalledWith('jest-test');
    expect(listUsers).toHaveBeenCalledWith({ search: 'user@example.com' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(buildAppUrl).toHaveBeenCalledWith('/reset-password');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });

    const [, fetchOptions] = fetchMock.mock.calls[0] as [string, { body: string }];
    const emailPayload = JSON.parse(fetchOptions.body);
    const resetLinkMatch = emailPayload.textContent.match(/https:\/\/\S+/);

    expect(emailPayload.subject).toBe('Reset your Skillogue password');
    expect(emailPayload.to).toEqual([{ email: 'user@example.com' }]);
    expect(resetLinkMatch).not.toBeNull();

    const resetUrl = new URL(resetLinkMatch[0]);

    expect(resetUrl.pathname).toBe('/reset-password');
    expect(resetUrl.searchParams.get('userId')).toBe('user-123');
    expect(resetUrl.searchParams.get('secret')).toBeTruthy();
  });

  it('resets the password when the signed token is valid', async () => {
    const request = createRequest('reset-password', {
      email: 'user@example.com',
    });

    await routeHandlers.POST(request, routeParams('reset-password'));

    const [, fetchOptions] = fetchMock.mock.calls[0] as [string, { body: string }];
    const emailPayload = JSON.parse(fetchOptions.body);
    const resetUrl = new URL(emailPayload.textContent.match(/https:\/\/\S+/)[0]);
    const resetResponse = await routeHandlers.PUT(
      createRequest('reset-password', {
        userId: 'user-123',
        secret: resetUrl.searchParams.get('secret'),
        password: 'Password123#',
      }),
      routeParams('reset-password')
    );

    expect(getUserById).toHaveBeenCalledWith({ userId: 'user-123' });
    expect(updatePassword).toHaveBeenCalledWith({
      userId: 'user-123',
      password: 'Password123#',
    });
    expect(resetResponse.status).toBe(200);
    await expect(resetResponse.json()).resolves.toEqual({ success: true });
  });

  it('returns success without sending email when the address is unknown', async () => {
    listUsers.mockResolvedValueOnce({ users: [] });

    const response = await routeHandlers.POST(
      createRequest('reset-password', { email: 'missing@example.com' }),
      routeParams('reset-password')
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});