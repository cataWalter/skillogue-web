export {};

const mockAuth = jest.fn();
const mockClerkClient = jest.fn();

jest.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
  clerkClient: () => mockClerkClient(),
}));

jest.mock('../../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextRequest: class NextRequest {},
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ status: (init && init.status) || 200, json: async () => body }),
  },
}));

describe('/api/auth/account route', () => {
  const deleteProfile = jest.fn();
  const deleteUser = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let routeHandlers: any;

  const createRequest = () => ({ headers: { get: jest.fn() } });

  beforeAll(async () => {
    routeHandlers = await import('../../src/app/api/auth/account/route');
  });

  beforeEach(() => {
    jest.clearAllMocks();
    deleteProfile.mockResolvedValue(undefined);
    deleteUser.mockResolvedValue(undefined);
    const { AppDataService } = require('../../src/lib/server/app-data-service');
    AppDataService.mockImplementation(() => ({ deleteProfile }));
    mockClerkClient.mockResolvedValue({ users: { deleteUser } });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const response = await routeHandlers.DELETE(createRequest());
    expect(response.status).toBe(401);
  });

  it('deletes profile and Clerk user (DELETE)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    const response = await routeHandlers.DELETE(createRequest());
    const body = await response.json();
    expect(deleteProfile).toHaveBeenCalledWith('user-123');
    expect(deleteUser).toHaveBeenCalledWith('user-123');
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('deletes profile and Clerk user (POST)', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-456' });
    const response = await routeHandlers.POST(createRequest());
    const body = await response.json();
    expect(deleteProfile).toHaveBeenCalledWith('user-456');
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 on error', async () => {
    mockAuth.mockResolvedValue({ userId: 'user-123' });
    deleteProfile.mockRejectedValue(new Error('DB error'));
    const response = await routeHandlers.DELETE(createRequest());
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.message).toBe('DB error');
  });
});
