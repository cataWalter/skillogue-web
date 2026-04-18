import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FavoritesPage from '../src/app/favorites/page';
import { appClient } from '../src/lib/appClient';
import { favoritesCopy, profileCopy } from '../src/lib/app-copy';
import { trackAnalyticsEvent } from '../src/lib/analytics';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom';

// Mock App Client client
jest.mock('../src/lib/appClient', () => ({
  appClient: {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/lib/analytics', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

describe('FavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
    render(<FavoritesPage />);
    // Check for loader (assuming Loader2 renders an SVG or similar)
    // Since we can't easily query the icon by text, we can check if the "Favorite Profiles" header is there
    expect(screen.getByText('Favorite Profiles')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('renders empty state when no favorites', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
    expect(screen.getByText('Find People')).toBeInTheDocument();
  });

  it('renders favorite profiles', async () => {
    const mockFavorites = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Hello world',
        location: 'New York, USA',
        age: 25,
        gender: 'Male',
        profile_languages: ['English'],
        created_at: '2023-01-01',
        profilepassions: ['Coding'],
        is_private: false,
      },
    ];
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  it('handles null data from get_saved_profiles gracefully', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

    await act(async () => {
        render(<FavoritesPage />);
    });

    expect(screen.getByText('Favorite Profiles')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('removes a favorite when trash icon is clicked', async () => {
    const mockFavorites = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        about_me: 'Hello world',
        location: 'New York, USA',
        age: 25,
        gender: 'Male',
        profile_languages: ['English'],
        created_at: '2023-01-01',
        profilepassions: ['Coding'],
        is_private: false,
      },
    ];
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null }); // For unsave_profile

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    expect(window.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('unsave_profile', { target_id: '1' });
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('cancels removal when confirm is rejected', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    window.confirm = jest.fn(() => false);

    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    expect(appClient.rpc).not.toHaveBeenCalledWith('unsave_profile', expect.anything());
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles remove error', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ error: { message: 'Error' } });
    window.confirm = jest.fn(() => true);

    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to remove');
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles load error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Error' } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load favorites');
    });
    consoleSpy.mockRestore();
  });

  it('renders private profile correctly', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', is_private: true, created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Private Profile')).toBeInTheDocument();
    });
  });

  it('handles RPC error with fallback', async () => {
    // Simulate a 42883 error code which triggers fallback
    (appClient.rpc as jest.Mock).mockResolvedValue({ 
      data: null, 
      error: { code: '42883', message: 'function does not exist' } 
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      // Should show empty state after fallback
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('handles unsave error gracefully', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ error: { message: 'Network error' } });
    window.confirm = jest.fn(() => true);

    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to remove');
    });
  });

  it('renders profile with all details', async () => {
    const mockFavorites = [
      {
        id: '1',
        first_name: 'Jane',
        last_name: 'Smith',
        about_me: 'Software developer',
        location: 'San Francisco, CA',
        age: 28,
        gender: 'Female',
        profile_languages: ['English', 'Spanish'],
        created_at: '2023-06-15',
        profilepassions: ['Music', 'Travel'],
        is_private: false,
      },
    ];
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Software developer')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
    });
  });

  it('handles empty profile data', async () => {
    const mockFavorites = [
      {
        id: '1',
        first_name: null,
        last_name: null,
        about_me: null,
        location: null,
        age: null,
        gender: null,
        profile_languages: null,
        created_at: '2023-01-01',
        profilepassions: [],
        is_private: false,
      },
    ];
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      // Should still render something even with null data
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Skillogue user')).toBeInTheDocument();
      expect(screen.getByText('This user has not added a bio yet.')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified')).toHaveLength(2);
    });
  });

  it('handles fallback from saved_profiles rpc when code is 42883', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('handles fallback from saved_profiles rpc when message contains uuid = name', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: 'PGRST301', message: 'relation "public.saved_profiles" does not exist' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('handles loadFavoritesFromTables with no auth', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: null, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('handles loadFavoritesFromTables with auth error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Auth error' } });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't saved any profiles yet.")).toBeInTheDocument();
    });
  });

  it('handles null fallback datasets without querying locations', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        };
      }
      if (table === 'profile_passions' || table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        };
      }
      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText(favoritesCopy.emptyState)).toBeInTheDocument();
    });

    expect((appClient.from as jest.Mock).mock.calls.filter(([table]) => table === 'locations')).toHaveLength(0);
  });

  it('handles loadFavoritesFromTables with favorites error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Favorites error' } })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Favorites error' });
    });
    consoleSpy.mockRestore();
  });

  it('handles loadFavoritesFromTables with profiles error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Profiles error' } })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Profiles error' });
    });
    consoleSpy.mockRestore();
  });

  it('handles loadFavoritesFromTables with passions error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [{ id: 'fav-1', location_id: 'loc_new_york_us' }], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions error' } })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Passions error' });
    });
    consoleSpy.mockRestore();
  });

  it('handles loadFavoritesFromTables with languages error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [{ id: 'fav-1', location_id: 'loc_new_york_us' }], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Languages error' } })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Languages error' });
    });
    consoleSpy.mockRestore();
  });

  it('handles loadFavoritesFromTables with locations error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [{ id: 'fav-1', location_id: 'loc_new_york_us' }], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Locations error' } })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Locations error' });
    });
    consoleSpy.mockRestore();
  });

  it('handles fallback error in useEffect', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883' }
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [{ id: 'fav-1', location_id: 'loc_new_york_us' }], error: null })
          }))
        };
      }
      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: { message: 'Mock error' } })
          }))
        };
      }
      return { select: jest.fn() };
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith({ message: 'Mock error' });
      expect(toast.error).toHaveBeenCalledWith('Failed to load favorites');
    });
    consoleSpy.mockRestore();
  });

  it('loads favorites from fallback tables and maps related names', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({
              data: [{ favorite_id: 'fav-1' }, { favorite_id: 'missing-profile' }],
              error: null,
            }),
          })),
        };
      }

      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'fav-1',
                  first_name: 'Fallback',
                  last_name: 'User',
                  about_me: 'Loaded from table fallback',
                  age: 34,
                  gender: 'woman',
                  location_id: 7,
                  created_at: '2023-06-15T00:00:00.000Z',
                  is_private: false,
                  show_age: true,
                  show_location: true,
                },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'profile_passions') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [
                { profile_id: 'fav-1', passions: { name: 'Hiking' } },
                { profile_id: 'fav-1', passions: [{ name: 'Travel' }] },
                { profile_id: 'fav-1', passions: null },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [
                { profile_id: 'fav-1', languages: { name: 'English' } },
                { profile_id: 'fav-1', languages: [{ name: 'Spanish' }] },
                { profile_id: 'fav-1', languages: null },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{ id: 7, city: 'Berlin' }],
              error: null,
            }),
          })),
        };
      }

      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Fallback User')).toBeInTheDocument();
      expect(screen.getByText('Loaded from table fallback')).toBeInTheDocument();
      expect(screen.getByText('Berlin')).toBeInTheDocument();
      expect(screen.getByText('Hiking')).toBeInTheDocument();
      expect(screen.getByText('Travel')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Spanish')).toBeInTheDocument();
    });

    expect(screen.queryByText('missing-profile')).not.toBeInTheDocument();
    expect((appClient.from as jest.Mock).mock.calls.filter(([table]) => table === 'locations')).toHaveLength(1);
  });

  it('falls back to an unspecified location when the fallback location lookup returns no rows', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-1' }], error: null })
          }))
        };
      }

      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [{
                id: 'fav-1',
                first_name: 'Fallback',
                last_name: 'Mapper',
                about_me: 'Mapped without a location row',
                age: 34,
                gender: 'woman',
                location_id: 'missing-loc',
                created_at: '2023-06-15T00:00:00.000Z',
                is_private: false,
                show_age: true,
                show_location: true,
              }],
              error: null,
            })
          }))
        };
      }

      if (table === 'profile_passions' || table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }

      if (table === 'locations') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: null, error: null })
          }))
        };
      }

      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Fallback Mapper')).toBeInTheDocument();
      expect(screen.getByText('Mapped without a location row')).toBeInTheDocument();
      expect(screen.getAllByText('Not specified')).toHaveLength(2);
    });

    expect((appClient.from as jest.Mock).mock.calls.filter(([table]) => table === 'locations')).toHaveLength(1);
  });

  it('returns empty fallback favorites when the auth helper is unavailable', async () => {
    const authClient = appClient.auth as { getUser?: unknown };
    const originalGetUser = authClient.getUser;

    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    });
    authClient.getUser = undefined;

    try {
      render(<FavoritesPage />);

      await waitFor(() => {
        expect(screen.getByText(favoritesCopy.emptyState)).toBeInTheDocument();
      });
    } finally {
      authClient.getUser = originalGetUser;
    }
  });

  it('skips the locations lookup for fallback favorites without a location and hides invalid joined dates', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { code: '42883', message: 'function does not exist' },
    });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'favorites') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [{ favorite_id: 'fav-2' }], error: null }),
          })),
        };
      }

      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'fav-2',
                  first_name: 'No',
                  last_name: 'Location',
                  about_me: null,
                  age: null,
                  gender: null,
                  location_id: null,
                  created_at: 'not-a-date',
                  is_private: false,
                  show_age: true,
                  show_location: true,
                },
              ],
              error: null,
            }),
          })),
        };
      }

      if (table === 'profile_passions' || table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            in: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }

      return { select: jest.fn() };
    });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('No Location')).toBeInTheDocument();
      expect(screen.getByText('This user has not added a bio yet.')).toBeInTheDocument();
    });

    expect(screen.queryByText(new RegExp(`^${profileCopy.joinedPrefix}`, 'i'))).not.toBeInTheDocument();
    expect((appClient.from as jest.Mock).mock.calls.filter(([table]) => table === 'locations')).toHaveLength(0);
  });

  it('removes a private favorite and tracks the removal analytics event', async () => {
    const mockFavorites = [
      {
        id: 'private-1',
        first_name: 'Private',
        last_name: 'Person',
        about_me: null,
        location: null,
        age: null,
        gender: null,
        profile_languages: [],
        created_at: '2023-01-01',
        profilepassions: [],
        is_private: true,
      },
    ];
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
    window.confirm = jest.fn(() => true);

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Private Person')).toBeInTheDocument();
      expect(screen.getByText(favoritesCopy.privateProfile)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle(favoritesCopy.removeTitle));

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('unsave_profile', { target_id: 'private-1' });
      expect(toast.success).toHaveBeenCalledWith(favoritesCopy.removeSuccess);
      expect(trackAnalyticsEvent).toHaveBeenCalledWith('favorite_removed', {
        profileId: 'private-1',
        source: 'favorites',
      });
      expect(screen.queryByText('Private Person')).not.toBeInTheDocument();
    });
  });
});
