/**
 * E2E Tests for Favorites, Notifications, and Settings Functionality
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FavoritesPage from '../../src/app/favorites/page';
import NotificationsPage from '../../src/app/notifications/page';
import SettingsPage from '../../src/app/settings/page';
import { appClient } from '../../src/lib/appClient';

// Mock next/navigation
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock appClient client
jest.mock('../../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock components
jest.mock('../../src/components/Avatar', () => ({
  __esModule: true,
  default: ({ seed }: { seed: string }) => <div data-testid="avatar">{seed}</div>,
}));

// Mock NotificationContext
jest.mock('../../src/context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: jest.fn(),
  }),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('Favorites E2E Tests', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockGetUser = appClient.auth.getUser as jest.Mock;
  const mockRpc = appClient.rpc as jest.Mock;
  
  const mockFavorites = [
    {
      id: 'user-456',
      first_name: 'Alice',
      last_name: 'Wonderland',
      about_me: 'Explorer',
      age: 25,
      gender: 'Female',
      location: 'Wonderland',
      profile_languages: ['English'],
      profilepassions: ['Adventure', 'Coding'],
      is_private: false,
      show_age: true,
      show_location: true,
      created_at: '2023-01-01',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    window.confirm = jest.fn();
  });

  describe('Favorites Page', () => {
    it('should load and display favorites', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockRpc.mockResolvedValue({ data: mockFavorites, error: null });

      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
        expect(screen.getByText('Explorer')).toBeInTheDocument();
      });
    });

    it('should display empty state when no favorites', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockRpc.mockResolvedValue({ data: [], error: null });

      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText(/haven't saved any profiles/i)).toBeInTheDocument();
        expect(screen.getByText(/Find People/i)).toBeInTheDocument();
      });
    });

    it('should handle loading error', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockRpc.mockResolvedValue({ data: null, error: { message: 'Error loading' } });

      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Favorite Profiles/i)).toBeInTheDocument();
      });
    });

    it('should remove user from favorites', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      mockRpc.mockResolvedValueOnce({ data: mockFavorites, error: null });
      
      let unsaveCalled = false;
      mockRpc.mockImplementationOnce((fn: string) => {
        if (fn === 'get_saved_profiles') {
          return Promise.resolve({ data: mockFavorites, error: null });
        }
        if (fn === 'unsave_profile') {
          unsaveCalled = true;
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      (window.confirm as jest.Mock).mockReturnValue(true);

      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      });

      // Find and click remove button - using title attribute
      const removeButton = screen.getByTitle(/Remove from Favorites/i);
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(unsaveCalled).toBe(true);
      });
    });

    it('should show private profile badge for private profiles', async () => {
      mockGetUser.mockResolvedValue({ data: { user: mockUser } });
      
      const privateFavorites = [{
        ...mockFavorites[0],
        is_private: true,
        about_me: null,
      }];
      
      mockRpc.mockResolvedValue({ data: privateFavorites, error: null });

      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Private Profile/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Notifications E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Notifications Page', () => {
    it('should display empty state when no notifications', async () => {
      // Using the mocked context from the top-level mock
      render(<NotificationsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
      });
    });
  });
});

describe('Settings E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe('Settings Page', () => {
    it('should render settings page with all sections', () => {
      render(<SettingsPage />);

      expect(screen.getByText(/Settings/i)).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Account/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Privacy/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Notifications/i })).toBeInTheDocument();
    });

    it('should have link to view profile', () => {
      render(<SettingsPage />);

      const viewProfileLink = screen.getByText(/View My Profile/i);
      expect(viewProfileLink).toHaveAttribute('href', '/profile');
    });

    it('should have link to edit profile', () => {
      render(<SettingsPage />);

      const editProfileLink = screen.getByText(/Edit Profile Details/i);
      expect(editProfileLink).toHaveAttribute('href', '/edit-profile');
    });

    it('should have link to request verification', () => {
      render(<SettingsPage />);

      const verificationLink = screen.getByText(/Request Verification/i);
      expect(verificationLink).toHaveAttribute('href', '/settings/verification');
    });

    it('should have link to change password', () => {
      render(<SettingsPage />);

      const passwordLink = screen.getByText(/Change Password/i);
      expect(passwordLink).toHaveAttribute('href', '/reset-password');
    });

    it('should have link to delete account', () => {
      render(<SettingsPage />);

      const deleteLink = screen.getByText(/Delete Account/i);
      expect(deleteLink).toHaveAttribute('href', '/settings/delete-account');
    });

    it('should have link to privacy settings', () => {
      render(<SettingsPage />);

      const privacyLink = screen.getByText(/Profile Visibility/i);
      expect(privacyLink).toHaveAttribute('href', '/settings/privacy');
    });

    it('should have link to blocked users', () => {
      render(<SettingsPage />);

      const blockedLink = screen.getByText(/Manage blocked users/i);
      expect(blockedLink).toHaveAttribute('href', '/settings/blocked');
    });

    it('should have link to data export', () => {
      render(<SettingsPage />);

      const exportLink = screen.getByText(/Download my data/i);
      expect(exportLink).toHaveAttribute('href', '/settings/data-export');
    });

    it('should navigate back to dashboard', () => {
      render(<SettingsPage />);

      const backLink = screen.getByText(/Back to Dashboard/i);
      expect(backLink).toHaveAttribute('href', '/dashboard');
    });
  });
});
