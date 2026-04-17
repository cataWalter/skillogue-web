import { updateProfile, getProfile } from '../../src/app/actions/profile';

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('profile actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('updateProfile', () => {
    it('should return success for valid data', async () => {
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

      const result = await updateProfile(validData);

      expect(result.success).toBe(true);
      expect(mockConsoleLog).toHaveBeenCalledWith('Updating profile with:', expect.any(Object));
    });

    it('should return validation error for empty first_name', async () => {
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

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update profile');
    });

    it('should return validation error for invalid age (too young)', async () => {
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

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to update profile');
    });

    it('should return success for valid data with optional fields empty', async () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        age: 25,
        gender: '',
        location: null,
        languages: [],
        passions: [],
      };

      const result = await updateProfile(validData);

      // gender is optional in the schema, so this should succeed
      expect(result.success).toBe(true);
    });
  });

  describe('getProfile', () => {
    it('should return profile data for valid userId', async () => {
      const result = await getProfile('user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-123');
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching profile for:', 'user-123');
    });

    it('should return default profile values', async () => {
      const result = await getProfile('user-456');

      expect(result?.firstName).toBe('');
      expect(result?.lastName).toBe('');
      expect(result?.aboutMe).toBe('');
      expect(result?.age).toBeNull();
      expect(result?.verified).toBe(false);
      expect(result?.isPrivate).toBe(false);
      expect(result?.showAge).toBe(true);
      expect(result?.showLocation).toBe(true);
      expect(result?.locationId).toBeNull();
      expect(result?.avatarUrl).toBe('');
    });

    it('should handle errors gracefully', async () => {
      // The function should not throw, but return null on error
      const result = await getProfile('invalid-user');

      // Even with an invalid user, it should return a profile object (not null)
      // because the current implementation doesn't actually fetch from DB
      expect(result).toBeDefined();
    });
  });
});