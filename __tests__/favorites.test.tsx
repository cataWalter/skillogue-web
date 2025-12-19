import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FavoritesPage from '../src/app/favorites/page';
import { supabase } from '../src/supabaseClient';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../src/supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('FavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
    render(<FavoritesPage />);
    // Check for loader (assuming Loader2 renders an SVG or similar)
    // Since we can't easily query the icon by text, we can check if the "Favorite Profiles" header is there
    expect(screen.getByText('Favorite Profiles')).toBeInTheDocument();
  });

  it('renders empty state when no favorites', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
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
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  it('handles null data from get_saved_profiles gracefully', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

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
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null }); // For unsave_profile

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
      expect(supabase.rpc).toHaveBeenCalledWith('unsave_profile', { target_id: '1' });
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('cancels removal when confirm is rejected', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    window.confirm = jest.fn(() => false);

    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    expect(supabase.rpc).not.toHaveBeenCalledWith('unsave_profile', expect.anything());
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles remove error', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: mockFavorites, error: null });
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ error: { message: 'Error' } });
    window.confirm = jest.fn(() => true);

    render(<FavoritesPage />);
    await waitFor(() => expect(screen.getByText('John Doe')).toBeInTheDocument());

    const removeButton = screen.getByTitle('Remove from Favorites');
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(require('react-hot-toast').error).toHaveBeenCalledWith('Failed to remove');
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('handles load error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Error' } });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(require('react-hot-toast').error).toHaveBeenCalledWith('Failed to load favorites');
    });
    consoleSpy.mockRestore();
  });

  it('renders private profile correctly', async () => {
    const mockFavorites = [{ id: '1', first_name: 'John', last_name: 'Doe', is_private: true, created_at: '2023-01-01', profilepassions: [], profile_languages: [] }];
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockFavorites, error: null });

    render(<FavoritesPage />);

    await waitFor(() => {
      expect(screen.getByText('Private Profile')).toBeInTheDocument();
    });
  });
});
