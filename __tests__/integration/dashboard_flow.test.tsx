import { act, render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../src/app/dashboard/page';
import { appClient } from '../../src/lib/appClient';
import { dashboardCopy } from '../../src/lib/app-copy';
import '@testing-library/jest-dom';

// Mock App Client client
jest.mock('../../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const createProfileSelectMock = (result: { data: unknown; error: unknown }) => ({
  select: jest.fn(() => ({
    eq: jest.fn(() => ({
      single: jest.fn().mockResolvedValue(result),
      maybeSingle: jest.fn().mockResolvedValue(result),
    })),
  })),
});

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

describe('Dashboard Integration Flow', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  
  const mockProfile = {
    id: 'user-123',
    first_name: 'Integration',
    about_me: 'Testing flows',
    passions_count: [{ count: 5 }],
    languages_count: [{ count: 2 }],
  };

  const mockConversations = [
    { 
      conversation_id: 'user-2',
      user_id: 'user-2', 
      first_name: 'Alice', 
      last_name: 'Wonderland',
      last_message: 'Hi', 
      last_message_time: '2023-01-01',
      unread: 1 
    },
  ];

  const mockSuggestions = [
    { id: 'user-3', first_name: 'Bob', shared_passions_count: 2 },
  ];

  const mockPassions = [
    { passion_id: 1, passions: { name: 'Coding' } },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful auth
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

    // Mock RPCs
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: mockConversations, error: null });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: mockSuggestions, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    // Mock DB queries
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({ data: mockProfile, error: null });
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });
  });

  it('loads and displays dashboard data correctly', async () => {
    render(<Dashboard />);

    // Check loading state
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();

    // Check loaded data
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText('Integration')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.getByText('Hi')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    const recentConversationsHeading = screen.getByRole('heading', { name: 'Recent Conversations' });
    const suggestedForYouHeading = screen.getByRole('heading', { name: 'Suggested for You' });

    expect(recentConversationsHeading.compareDocumentPosition(suggestedForYouHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('handles partial data fetch errors gracefully', async () => {
    // Mock errors for secondary data
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: null, error: { message: 'Convo Error' } });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: null, error: { message: 'Suggest Error' } });
      return Promise.resolve({ data: [], error: null });
    });

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({
          data: {
            ...mockProfile,
            passions_count: [{ count: 0 }],
            languages_count: [{ count: 0 }],
          },
          error: null,
        });
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions Error' } }),
          })),
        };
      }
      return { select: jest.fn() };
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith("Error fetching conversations:", expect.objectContaining({ message: 'Convo Error' }));
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching suggestions:", expect.objectContaining({ message: 'Suggest Error' }));
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching passions:", expect.objectContaining({ message: 'Passions Error' }));

    consoleSpy.mockRestore();
  });

  it('handles conversation with no timestamp', async () => {
    const convoNoTime = { ...mockConversations[0], last_message_time: null };
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: [convoNoTime], error: null });
      return Promise.resolve({ data: [], error: null });
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    });
  });

  it('renders shared fallback placeholders for incomplete dashboard cards', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') {
        return Promise.resolve({
          data: [
            {
              conversation_id: 'user-2',
              user_id: 'user-2',
              first_name: null,
              last_name: null,
              last_message: '',
              last_message_time: null,
              unread: 0,
            },
          ],
          error: null,
        });
      }

      if (fn === 'get_suggested_profiles') {
        return Promise.resolve({
          data: [{ id: 'user-3', first_name: null, last_name: null, shared_passions_count: 2 }],
          error: null,
        });
      }

      return Promise.resolve({ data: [], error: null });
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText('Skillogue user')).toHaveLength(2);
    });

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('redirects to onboarding if profile is incomplete', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock incomplete profile
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({ data: { ...mockProfile, first_name: null }, error: null });
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });

    consoleSpy.mockRestore();
  });

  it('redirects to onboarding if the profile gate returns an error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({ data: null, error: { message: 'profile failed' } });
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Profile incomplete or error fetching:', { message: 'profile failed' });
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
      expect(appClient.rpc).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('falls back to empty secondary panels when follow-up payloads are null', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: null, error: null });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: null, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({ data: mockProfile, error: null });
      }

      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(dashboardCopy.noConversationsTitle)).toBeInTheDocument();
      expect(screen.getByText(dashboardCopy.suggestionsEmpty)).toBeInTheDocument();
    });
  });

  it('clears the skeleton when the initial dashboard fetch throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.auth.getUser as jest.Mock).mockRejectedValueOnce(new Error('dashboard failed'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dashboard data:', expect.any(Error));
      expect(screen.queryByTestId('dashboard-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText(dashboardCopy.discoverSubtitle)).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('skips secondary state updates after the dashboard unmounts', async () => {
    const conversationsDeferred = createDeferred<{ data: unknown; error: unknown }>();
    const suggestionsDeferred = createDeferred<{ data: unknown; error: unknown }>();
    const passionsDeferred = createDeferred<{ data: unknown; error: unknown }>();

    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return conversationsDeferred.promise;
      if (fn === 'get_suggested_profiles') return suggestionsDeferred.promise;
      return Promise.resolve({ data: [], error: null });
    });

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return createProfileSelectMock({ data: mockProfile, error: null });
      }

      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => passionsDeferred.promise),
          })),
        };
      }

      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });

    const { unmount } = render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
      expect(screen.getByText('Integration')).toBeInTheDocument();
    });

    unmount();

    await act(async () => {
      conversationsDeferred.resolve({ data: mockConversations, error: null });
      suggestionsDeferred.resolve({ data: mockSuggestions, error: null });
      passionsDeferred.resolve({ data: mockPassions, error: null });
      await Promise.resolve();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to login if not authenticated', async () => {
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
