import { act, render, screen, waitFor } from '@testing-library/react';
import DashboardClient from '../../src/app/dashboard/DashboardClient';
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

const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });

  return { promise, resolve };
};

describe('Dashboard Integration Flow', () => {
  const mockUserId = 'user-123';

  const mockInitialProfile = {
    id: 'user-123',
    first_name: 'Integration',
    about_me: 'Testing flows',
    passions_count: 5,
    languages_count: 2,
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

    // Mock RPCs
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: mockConversations, error: null });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: mockSuggestions, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    // Mock DB queries
    (appClient.from as jest.Mock).mockImplementation((table) => {
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
    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

    // Hero section renders immediately from server-provided profile data
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();

    // Wait for panel data to load
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
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions Error' } }),
          })),
        };
      }
      return { select: jest.fn() };
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

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

    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

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

    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

    await waitFor(() => {
      expect(screen.getAllByText('Skillogue user')).toHaveLength(2);
    });

    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('falls back to empty secondary panels when follow-up payloads are null', async () => {
    (appClient.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: null, error: null });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: null, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    (appClient.from as jest.Mock).mockImplementation((table) => {
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

    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

    await waitFor(() => {
      expect(screen.getByText(dashboardCopy.noConversationsTitle)).toBeInTheDocument();
      expect(screen.getByText(dashboardCopy.suggestionsEmpty)).toBeInTheDocument();
    });
  });

  it('shows error toast when panels fetch throws', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (appClient.rpc as jest.Mock).mockRejectedValueOnce(new Error('panels failed'));

    render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching dashboard panels:', expect.any(Error));
      expect(screen.getByText(dashboardCopy.discoverTitle)).toBeInTheDocument();
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

    const { unmount } = render(<DashboardClient userId={mockUserId} initialProfile={mockInitialProfile} />);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText('Integration')).toBeInTheDocument();

    unmount();

    await act(async () => {
      conversationsDeferred.resolve({ data: mockConversations, error: null });
      suggestionsDeferred.resolve({ data: mockSuggestions, error: null });
      passionsDeferred.resolve({ data: mockPassions, error: null });
      await Promise.resolve();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
