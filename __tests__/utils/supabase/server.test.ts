// Mock next/headers before importing the module under test
const mockCookies = {
  getAll: jest.fn(),
  set: jest.fn(),
};

jest.mock('next/headers', () => {
  return {
    cookies: jest.fn().mockImplementation(() => {
      return mockCookies;
    }),
  };
});

// Mock @supabase/ssr - use function that returns mock
jest.mock('@supabase/ssr', () => {
  const mockFn = jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
  }));
  return {
    createServerClient: mockFn,
  };
});

// Access the mock after jest.mock is set up
const mockCreateServerClient = require('@supabase/ssr').createServerClient;

// Now import after mocks are set up
import { createClient } from '../../../src/utils/supabase/server';

describe('createClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('should create a Supabase client with correct configuration', async () => {
    const client = await createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.any(Object),
      })
    );
    expect(client).toBeDefined();
  });

  it('should return cookies from cookie store', async () => {
    const mockCookieData = [
      { name: 'test-cookie', value: 'test-value' },
    ];
    mockCookies.getAll.mockReturnValue(mockCookieData);

    await createClient();

    const cookiesConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2].cookies;
    const result = cookiesConfig.getAll();
    expect(result).toEqual(mockCookieData);
  });

  it('should handle setAll cookies operation', async () => {
    await createClient();

    const cookiesConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2].cookies;
    const cookiesToSet = [
      { name: 'session', value: 'abc123', options: { httpOnly: true } },
    ];

    // Should not throw
    cookiesConfig.setAll(cookiesToSet);

    expect(mockCookies.set).toHaveBeenCalledWith('session', 'abc123', { httpOnly: true });
  });

  it('should handle setAll errors gracefully', async () => {
    mockCookies.set.mockImplementation(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    await createClient();

    const cookiesConfig = (mockCreateServerClient as jest.Mock).mock.calls[0][2].cookies;
    const cookiesToSet = [
      { name: 'session', value: 'abc123', options: {} },
    ];

    // Should not throw even when set fails
    expect(() => cookiesConfig.setAll(cookiesToSet)).not.toThrow();
  });
});
