/**
 * Integration-style Jest tests for Favorites, Notifications, and Settings.
 */

import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import FavoritesPage from '../src/app/favorites/page';
import NotificationsPage from '../src/app/notifications/page';
import SettingsPage from '../src/app/settings/page';
import { appClient } from '../src/lib/appClient';

const mockPush = jest.fn();
const mockMarkAsRead = jest.fn();
const mockNotificationsState: {
  notifications: Array<{
    id: string;
    type: string;
    actorId: string | null;
    read: boolean;
    createdAt: string;
  }>;
  unreadCount: number;
} = {
  notifications: [],
  unreadCount: 0,
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

jest.mock('../src/hooks/useProfileGate', () => ({
  useProfileGate: jest.fn(),
}));

jest.mock('../src/components/Avatar', () => ({
  __esModule: true,
  default: ({ seed }: { seed: string }) => <div data-testid="avatar">{seed}</div>,
}));

jest.mock('../src/context/NotificationContext', () => ({
  useNotifications: () => ({
    notifications: mockNotificationsState.notifications,
    unreadCount: mockNotificationsState.unreadCount,
    markAsRead: mockMarkAsRead,
  }),
}));


jest.mock('../src/components/PushNotificationToggle', () => ({
  __esModule: true,
  default: () => <div>Push Notifications Toggle</div>,
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('Favorites integration tests', () => {
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

  it('loads and displays favorites', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockRpc.mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.getByText('Explorer')).toBeInTheDocument();
    });
  });

  it('displays empty state when no favorites', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockRpc.mockResolvedValue({ data: [], error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(/haven't saved any profiles/i)).toBeInTheDocument();
      expect(screen.getByText(/Find People/i)).toBeInTheDocument();
    });
  });

  it('handles loading error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Error loading' } });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Favorite Profiles/i)).toBeInTheDocument();
    });
  });

  it('removes a user from favorites', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    let unsaveCalled = false;
    mockRpc.mockImplementation((fn: string) => {
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

    fireEvent.click(screen.getByTitle(/Remove from Favorites/i));

    await waitFor(() => {
      expect(unsaveCalled).toBe(true);
    });
  });

  it('shows a private profile badge for private profiles', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    mockRpc.mockResolvedValue({
      data: [{ ...mockFavorites[0], is_private: true, about_me: null }],
      error: null,
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Private Profile/i)).toBeInTheDocument();
    });
  });
});

describe('Notifications integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockMarkAsRead.mockReset();
    mockNotificationsState.notifications = [];
    mockNotificationsState.unreadCount = 0;
  });

  it('displays empty state when no notifications', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
    });
  });

  it('renders notification links and mark-all action for unread notifications', async () => {
    mockNotificationsState.notifications = [
      {
        id: 'notification-1',
        type: 'new_message',
        actorId: 'actor-1',
        read: false,
        createdAt: '2026-04-26T12:00:00.000Z',
      },
      {
        id: 'notification-2',
        type: 'unknown',
        actorId: null,
        read: true,
        createdAt: '2026-04-25T12:00:00.000Z',
      },
    ];
    mockNotificationsState.unreadCount = 1;

    render(<NotificationsPage />);

    const links = await screen.findAllByRole('link');
    expect(links[0]).toHaveAttribute('href', '/messages?conversation=actor-1');
    expect(links[1]).toHaveAttribute('href', '#');
    expect(screen.getAllByText('actor-1')).toHaveLength(2);
    expect(screen.getByText(/you have a new notification/i)).toBeInTheDocument();
    expect(screen.getByTitle(/unread/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));
    expect(mockMarkAsRead).toHaveBeenCalledWith(null);
  });

  it('tracks opens and only marks unread notifications as read', async () => {
    mockNotificationsState.notifications = [
      {
        id: 'notification-1',
        type: 'new_message',
        actorId: 'actor-1',
        read: false,
        createdAt: '2026-04-26T12:00:00.000Z',
      },
      {
        id: 'notification-2',
        type: 'new_message',
        actorId: null,
        read: true,
        createdAt: '2026-04-25T12:00:00.000Z',
      },
    ];
    mockNotificationsState.unreadCount = 1;

    render(<NotificationsPage />);

    const links = await screen.findAllByRole('link');
    fireEvent.click(links[0]);
    fireEvent.click(links[1]);

    expect(mockMarkAsRead).toHaveBeenCalledTimes(1);
    expect(mockMarkAsRead).toHaveBeenCalledWith('notification-1');
  });
});

describe('Settings integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  it('renders settings page with all sections', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: /^Settings$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Start with the outcome you want/i })).toBeInTheDocument();
    expect(screen.getByText(/Profile and presence/i)).toBeInTheDocument();
    expect(screen.getByText(/Privacy and boundaries/i)).toBeInTheDocument();
    expect(screen.getByText(/Account changes/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Profile$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Account$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Privacy$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Notifications$/i })).toBeInTheDocument();
    expect(screen.getByText(/Why some settings open elsewhere/i)).toBeInTheDocument();
  });

  it('keeps the expected settings navigation links', () => {
    render(<SettingsPage />);

    const viewProfileLinks = screen.getAllByRole('link', { name: /View My Profile/i });
    const editProfileLinks = screen.getAllByRole('link', { name: /Edit Profile Details/i });

    expect(viewProfileLinks).toHaveLength(2);
    expect(editProfileLinks).toHaveLength(2);
    viewProfileLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/profile');
    });
    editProfileLinks.forEach((link) => {
      expect(link).toHaveAttribute('href', '/edit-profile');
    });
    expect(screen.getByRole('link', { name: /Request Verification/i })).toHaveAttribute('href', '/settings/verification');
    expect(screen.getByRole('link', { name: /Change Password/i })).toHaveAttribute('href', '/change-password');
    expect(screen.getByRole('link', { name: /Delete Account/i })).toHaveAttribute('href', '/settings/delete-account');
    expect(screen.getByRole('link', { name: /Profile Visibility/i })).toHaveAttribute('href', '/settings/privacy');
    expect(screen.getByRole('link', { name: /Manage blocked users/i })).toHaveAttribute('href', '/settings/blocked');
    expect(screen.getByRole('link', { name: /Download my data/i })).toHaveAttribute('href', '/settings/data-export');
    expect(screen.getByRole('link', { name: /Back to Dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(within(viewProfileLinks[1]).getAllByText('Preview')).toHaveLength(2);
    expect(within(editProfileLinks[1]).getAllByText('Edit details')).toHaveLength(2);
    expect(within(screen.getByRole('link', { name: /Profile Visibility/i })).getAllByText('Manage visibility')).toHaveLength(2);
    expect(within(screen.getByRole('link', { name: /Download my data/i })).getAllByText('Open export')).toHaveLength(2);
  });
});
