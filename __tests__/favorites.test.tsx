import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FavoritesClient from '../src/app/favorites/FavoritesClient';
import { appClient } from '../src/lib/appClient';
import { favoritesCopy } from '../src/lib/app-copy';
import toast from 'react-hot-toast';
import '@testing-library/jest-dom';

jest.mock('../src/lib/appClient', () => ({
  appClient: {
    rpc: jest.fn(),
  },
}));

jest.mock('../src/components/Avatar', () => ({
  __esModule: true,
  default: ({ seed }: { seed: string }) => <div data-testid="avatar">{seed}</div>,
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const emptyFavorites: any[] = [];

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

describe('FavoritesClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders page header', () => {
    render(<FavoritesClient initialFavorites={emptyFavorites} />);
    expect(screen.getByText(favoritesCopy.title)).toBeInTheDocument();
  });

  it('renders empty state when no favorites', () => {
    render(<FavoritesClient initialFavorites={emptyFavorites} />);
    expect(screen.getByText(favoritesCopy.emptyState)).toBeInTheDocument();
    expect(screen.getByText(favoritesCopy.findPeople)).toBeInTheDocument();
  });

  it('renders favorite profiles', () => {
    render(<FavoritesClient initialFavorites={mockFavorites} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders private profile correctly', () => {
    const privateFavorites = [
      { id: '1', first_name: 'John', last_name: 'Doe', is_private: true, created_at: '2023-01-01', profilepassions: [], profile_languages: [] },
    ];
    render(<FavoritesClient initialFavorites={privateFavorites} />);
    expect(screen.getByText(favoritesCopy.privateProfile)).toBeInTheDocument();
  });

  it('removes a favorite when trash icon is clicked', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
    window.confirm = jest.fn(() => true);

    render(<FavoritesClient initialFavorites={mockFavorites} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    fireEvent.click(screen.getByTitle(favoritesCopy.removeTitle));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('unsave_profile', { target_id: '1' });
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('cancels removal when confirm is rejected', () => {
    window.confirm = jest.fn(() => false);

    render(<FavoritesClient initialFavorites={mockFavorites} />);
    fireEvent.click(screen.getByTitle(favoritesCopy.removeTitle));

    expect(appClient.rpc).not.toHaveBeenCalled();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('handles remove error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ error: { message: 'Network error' } });
    window.confirm = jest.fn(() => true);

    render(<FavoritesClient initialFavorites={mockFavorites} />);
    fireEvent.click(screen.getByTitle(favoritesCopy.removeTitle));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(favoritesCopy.removeError);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  it('renders profile with all details', () => {
    const detailedFavorites = [
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
    render(<FavoritesClient initialFavorites={detailedFavorites} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Software developer')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('handles empty profile data gracefully', () => {
    const emptyProfileFavorites = [
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
    render(<FavoritesClient initialFavorites={emptyProfileFavorites} />);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Skillogue user')).toBeInTheDocument();
    expect(screen.getByText('This user has not added a bio yet.')).toBeInTheDocument();
  });
});
