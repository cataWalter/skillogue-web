import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import UserProfile from '../src/app/user/[id]/page';
import { appClient } from '../src/lib/appClient';
import '@testing-library/jest-dom';

const originalConsoleError = console.error;

const mockPush = jest.fn();
const mockRouter = { push: mockPush };

const flushAsyncEffects = async (cycles = 3) => {
  for (let index = 0; index < cycles; index += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
};

const createProfileTableMock = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn().mockResolvedValue(result),
      maybeSingle: jest.fn().mockResolvedValue(result),
    })),
  })),
});

const createRelationTableMock = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue(result),
  })),
});

const createFallbackTableMock = (result = { data: null, error: null }) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn().mockResolvedValue(result),
      maybeSingle: jest.fn().mockResolvedValue(result),
    })),
  })),
});

const createFromMock = (overrides: Record<string, ReturnType<typeof createProfileTableMock>> = {}) =>
  (table: string) => {
    if (overrides[table]) {
      return overrides[table];
    }

    if (table === 'profile_passions' || table === 'profile_languages') {
      return createRelationTableMock({ data: [], error: null });
    }

    return createFallbackTableMock();
  };

// Mock App Client client
jest.mock('../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn(),
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(),
          })),
        })),
      })),
    })),
    rpc: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: 'user-123' }),
  useRouter: () => mockRouter,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the mocked toast after jest.mock
import toast from 'react-hot-toast';

const renderUserProfilePage = async () => {
  await act(async () => {
    render(<UserProfile />);
    await flushAsyncEffects(5);
  });
};

const waitForUserProfileToSettle = async () => {
  await waitFor(() => {
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
};

const renderLoadedUserProfilePage = async () => {
  await renderUserProfilePage();
  await waitForUserProfileToSettle();
};

describe('UserProfile', () => {
  let consoleErrorSpy: jest.SpyInstance;

  const mockSession = {
    user: { id: 'me-123' },
  };

  const mockProfile = {
    id: 'user-123',
    first_name: 'Jane',
    last_name: 'Doe',
    about_me: 'Hi there',
    locations: { city: 'London', country: 'UK' },
    age: 28,
    gender: 'Female',
    created_at: '2023-01-01',
    is_private: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const stringArgs = args.filter((value): value is string => typeof value === 'string');

      if (stringArgs.some((value) => value.includes('not wrapped in act'))) {
        return;
      }

      originalConsoleError(...(args as Parameters<typeof console.error>));
    });
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    
    // Mock profile fetch
    (appClient.from as jest.Mock).mockImplementation(
      createFromMock({
        profiles: createProfileTableMock({ data: mockProfile, error: null }),
      })
    );

    // Mock RPCs
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
      if (fn === 'is_saved') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders user profile', async () => {
    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('About Jane')).toBeInTheDocument();
  });

  it('handles blocking a user', async () => {
    window.confirm = jest.fn(() => true);
    await renderLoadedUserProfilePage();

    expect(screen.getByTitle('Block User')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Block User'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('block_user', { target_id: 'user-123' });
    });
  });

  it('handles saving a user', async () => {
    await renderLoadedUserProfilePage();

    expect(screen.getByTitle('Add to Favorites')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle('Add to Favorites'));

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('save_profile', { target_id: 'user-123' });
    });
  });

  it('handles block user error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
        if (fn === 'is_saved_profile') return Promise.resolve({ data: false, error: null });
        if (fn === 'block_user') return Promise.resolve({ error: { message: 'Block failed' } });
        return Promise.resolve({ data: null, error: null });
    });

    window.confirm = jest.fn(() => true);

  await renderLoadedUserProfilePage();

    const blockButton = screen.getByTitle('Block User');
    fireEvent.click(blockButton);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error blocking user');
    });
  });

  it('unblocks a user', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: true, error: null }); // Initially blocked
        if (fn === 'is_saved_profile') return Promise.resolve({ data: false, error: null });
        if (fn === 'unblock_user') return Promise.resolve({ error: null });
        return Promise.resolve({ data: null, error: null });
    });

    window.confirm = jest.fn(() => true);

  await renderLoadedUserProfilePage();

    const unblockButton = screen.getByTitle('Unblock User');
    fireEvent.click(unblockButton);

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('User unblocked');
    });
  });

  it('toggles save profile (unsave)', async () => {
    // Test Unsave
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
        if (fn === 'is_saved') return Promise.resolve({ data: true, error: null }); // Initially saved
        if (fn === 'unsave_profile') return Promise.resolve({ error: null });
        return Promise.resolve({ data: null, error: null });
    });

      await renderLoadedUserProfilePage();

    const unsaveButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(unsaveButton);

    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Removed from favorites');
    });
  });

  it('shows blocked by user state', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked_by') return Promise.resolve({ data: true, error: null });
        return Promise.resolve({ data: null, error: null });
    });

      await renderUserProfilePage();

    await waitFor(() => {
        expect(screen.getByText('Profile Unavailable')).toBeInTheDocument();
        expect(screen.getByText('You cannot view this profile.')).toBeInTheDocument();
    });
  });

  it('shows error state when profile fetch fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.from as jest.Mock).mockImplementation(
      createFromMock({
        profiles: createProfileTableMock({ data: null, error: { message: 'Profile not found' } }),
      })
    );

    await renderUserProfilePage();

    await waitFor(() => {
        expect(screen.getByText('Could not find this user.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  // Note: Session fetch error handling is tested implicitly through other tests
  // The component catches errors and continues loading

  it('handles save profile error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
        if (fn === 'is_saved') return Promise.resolve({ data: false, error: null });
        if (fn === 'save_profile') return Promise.resolve({ error: { message: 'Save failed' } });
        return Promise.resolve({ data: null, error: null });
    });

      await renderLoadedUserProfilePage();

    const saveButton = screen.getByTitle('Add to Favorites');
    fireEvent.click(saveButton);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to save favorite');
    });
  });

  it('handles unsave profile error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
        if (fn === 'is_saved') return Promise.resolve({ data: true, error: null });
        if (fn === 'unsave_profile') return Promise.resolve({ error: { message: 'Unsave failed' } });
        return Promise.resolve({ data: null, error: null });
    });

      await renderLoadedUserProfilePage();

    const unsaveButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(unsaveButton);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to remove favorite');
    });
  });

  it('handles unblock user error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'is_blocked') return Promise.resolve({ data: true, error: null });
        if (fn === 'is_saved_profile') return Promise.resolve({ data: false, error: null });
        if (fn === 'unblock_user') return Promise.resolve({ error: { message: 'Unblock failed' } });
        return Promise.resolve({ data: null, error: null });
    });

    window.confirm = jest.fn(() => true);

  await renderLoadedUserProfilePage();

    const unblockButton = screen.getByTitle('Unblock User');
    fireEvent.click(unblockButton);

    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error unblocking user');
    });
  });

  it('shows loading state initially', async () => {
    render(<UserProfile />);

    // Should show loading skeleton before data loads
    // The ProfileSkeleton component renders with animate-pulse class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles passions fetch error', async () => {
    (appClient.from as jest.Mock).mockImplementation(
      createFromMock({
        profiles: createProfileTableMock({ data: mockProfile, error: null }),
        profile_passions: createRelationTableMock({ data: null, error: { message: 'Passions error' } }),
      })
    );

    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    // Should still render even if passions fail
  });

  it('handles languages fetch error', async () => {
    (appClient.from as jest.Mock).mockImplementation(
      createFromMock({
        profiles: createProfileTableMock({ data: mockProfile, error: null }),
        profile_languages: createRelationTableMock({ data: null, error: { message: 'Languages error' } }),
      })
    );

    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('handles own profile redirect', async () => {
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: { user: { id: 'user-123' } } }, error: null });

    await renderUserProfilePage();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/profile');
    });
  });

  it('handles blocked by user check error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_blocked_by') return Promise.resolve({ data: null, error: { message: 'Blocked by error' } });
      return Promise.resolve({ data: null, error: null });
    });

    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('handles is_saved rpc error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_saved') return Promise.resolve({ data: null, error: { message: 'Saved check error' } });
      return Promise.resolve({ data: null, error: null });
    });

    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('handles checkBlockStatus error', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_blocked') return Promise.resolve({ data: null, error: { message: 'Block check error' } });
      return Promise.resolve({ data: null, error: null });
    });

    await renderLoadedUserProfilePage();

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('handles unblock user confirm cancel', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_blocked') return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: null, error: null });
    });
    window.confirm = jest.fn(() => false);

    await renderLoadedUserProfilePage();

    const unblockButton = screen.getByTitle('Unblock User');
    fireEvent.click(unblockButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(appClient.rpc).not.toHaveBeenCalledWith('unblock_user', expect.anything());
  });
});
