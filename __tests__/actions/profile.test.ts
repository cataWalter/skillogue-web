import { updateProfile, getProfile } from '../../src/app/actions/profile';

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock server dependencies
jest.mock('../../src/lib/server/current-user', () => ({
  getCurrentUserFromCookies: jest.fn(),
}));

jest.mock('../../src/lib/server/app-data-service', () => ({
  AppDataService: jest.fn().mockImplementation(() => ({
    saveProfileData: jest.fn(),
  })),
}));

// Mock console
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => { });
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });

describe('profile actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock fetch globally
    global.fetch = jest.fn();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      const { getCurrentUserFromCookies } = require('../../src/lib/server/current-user');
      const { AppDataService } = require('../../src/lib/server/app-data-service');
      getCurrentUserFromCookies.mockResolvedValue({ id: 'user-123' });
      AppDataService.mockImplementation(() => ({
        saveProfileData: jest.fn().mockResolvedValue(undefined),
      }));
    });

    it('should return success for valid data', async () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '1995-04-25',
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
        birth_date: '1995-04-25',
        gender: 'male',
        location: { country: 'USA', city: 'NYC' },
        languages: ['English'],
        passions: ['Music'],
      };

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should return validation error for invalid birth date (too young)', async () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '2015-04-25',
        gender: 'male',
        location: { country: 'USA', city: 'NYC' },
        languages: ['English'],
        passions: ['Music'],
      };

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    it('should return success for valid data with optional fields empty', async () => {
      const validData = {
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '1995-04-25',
        gender: 'male',
        location: { country: null, city: null, region: null },
        languages: [],
        passions: [],
      };

      const result = await updateProfile(validData);

      expect(result.success).toBe(true);
    });

    it('should return not authenticated when the current user is missing', async () => {
      const { getCurrentUserFromCookies } = require('../../src/lib/server/current-user');
      getCurrentUserFromCookies.mockResolvedValueOnce(null);

      const result = await updateProfile({
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '1995-04-25',
        gender: 'male',
        location: { country: 'USA', city: 'NYC' },
        languages: ['English'],
        passions: ['Music'],
      });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('should return a service error when saving the profile fails', async () => {
      const { AppDataService } = require('../../src/lib/server/app-data-service');
      AppDataService.mockImplementation(() => ({
        saveProfileData: jest.fn().mockRejectedValueOnce(new Error('save failed')),
      }));

      const result = await updateProfile({
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '1995-04-25',
        gender: 'male',
        location: { country: 'USA', city: 'NYC' },
        languages: ['English'],
        passions: ['Music'],
      });

      expect(result).toEqual({ success: false, error: 'Failed to update profile' });
    });

    it('should return validation error for unsupported gender values', async () => {
      const invalidData = {
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Test bio',
        birth_date: '1995-04-25',
        gender: 'other',
        location: { country: 'USA', city: 'NYC' },
        languages: ['English'],
        passions: ['Music'],
      };

      const result = await updateProfile(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result).toMatchObject({
        details: {
          gender: expect.arrayContaining(['Gender must be Male or Female']),
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should return profile data for valid userId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'user-123', firstName: 'John' }),
      });

      const result = await getProfile('user-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-123');
      expect(mockConsoleLog).toHaveBeenCalledWith('Fetching profile for:', 'user-123');
    });

    it('should use the localhost fallback when NEXT_PUBLIC_APP_URL is not configured', async () => {
      const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

      delete process.env.NEXT_PUBLIC_APP_URL;
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 'user-123' }),
      });

      try {
        await getProfile('user-123');

        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/profile/user-123',
          expect.objectContaining({
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      } finally {
        if (originalAppUrl === undefined) {
          delete process.env.NEXT_PUBLIC_APP_URL;
        } else {
          process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
        }
      }
    });

    it('should return default profile values', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          firstName: '',
          lastName: '',
          aboutMe: '',
          age: null,
          verified: false,
          isPrivate: false,
          showAge: true,
          showLocation: true,
          locationId: null,
          avatarUrl: '',
        }),
      });

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
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await getProfile('invalid-user');

      expect(result).toBeNull();
    });

    it('should return null when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network error'));

      const result = await getProfile('invalid-user');

      expect(result).toBeNull();
    });
  });
});
