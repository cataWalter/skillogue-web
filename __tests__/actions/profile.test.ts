import { updateProfileAction } from '../../src/app/actions/profile';

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('../../src/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}));

describe('updateProfileAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return validation error for invalid data', async () => {
    const invalidData = {
      first_name: '',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: { country: 'USA', city: 'NYC' },
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
    expect(result.details).toBeDefined();
  });

  it('should return validation error for invalid age', async () => {
    const invalidData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 10,
      gender: 'male',
      location: { country: 'USA', city: 'NYC' },
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(invalidData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Validation failed');
  });

  it('should return not authenticated error when user is not logged in', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: { country: 'USA', city: 'NYC' },
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('should successfully update profile with location', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockLocationData = { id: 'loc-123' };
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: mockLocationData, error: null }),
      }),
    });
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data: [{ id: 'lang-1', name: 'English' }] }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'locations') {
        return { insert: mockInsert };
      }
      if (table === 'profiles') {
        return { update: mockUpdate };
      }
      if (table === 'languages') {
        return { select: mockSelect };
      }
      if (table === 'profile_languages') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'passions') {
        return { select: mockSelect };
      }
      if (table === 'profile_passions') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: { country: 'USA', city: 'NYC' },
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should successfully update profile without location', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data: [{ id: 'lang-1', name: 'English' }] }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockUpdate };
      }
      if (table === 'languages') {
        return { select: mockSelect };
      }
      if (table === 'profile_languages') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'passions') {
        return { select: mockSelect };
      }
      if (table === 'profile_passions') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: null,
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle empty languages array', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data: [] }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockUpdate };
      }
      if (table === 'profile_languages') {
        return { delete: mockDelete };
      }
      if (table === 'passions') {
        return { select: mockSelect };
      }
      if (table === 'profile_passions') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: null,
      languages: [],
      passions: ['Music'],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(true);
  });

  it('should handle empty passions array', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockDelete = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    const mockSelect = jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({ data: [{ id: 'lang-1', name: 'English' }] }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockUpdate };
      }
      if (table === 'languages') {
        return { select: mockSelect };
      }
      if (table === 'profile_languages') {
        return { delete: mockDelete, insert: jest.fn().mockResolvedValue({ error: null }) };
      }
      if (table === 'profile_passions') {
        return { delete: mockDelete };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: null,
      languages: ['English'],
      passions: [],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(true);
  });

  it('should handle location insert error', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Location insert failed' } 
        }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'locations') {
        return { insert: mockInsert };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: { country: 'USA', city: 'NYC' },
      languages: ['English'],
      passions: ['Music'],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Location insert failed');
  });

  it('should handle profile update error', async () => {
    const mockUser = { id: 'user-123' };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ 
        error: { message: 'Profile update failed' } 
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return { update: mockUpdate };
      }
      return {};
    });

    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Test bio',
      age: 25,
      gender: 'male',
      location: null,
      languages: [],
      passions: [],
    };

    const result = await updateProfileAction(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile update failed');
  });
});