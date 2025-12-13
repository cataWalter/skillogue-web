import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '../../src/app/search/page';
import { supabase } from '../../src/supabaseClient';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: jest.fn() }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Search Integration Flow', () => {
  const mockUser = { id: 'user-123' };
  const mockSession = { user: mockUser };
  
  const mockResults = [
    {
      id: 'user-2',
      first_name: 'Alice',
      last_name: 'Wonderland',
      about_me: 'Explorer',
      location: 'Wonderland',
      age: 25,
      gender: 'Female',
      profile_languages: ['English'],
      created_at: '2023-01-01',
      profilepassions: ['Adventure'],
      is_private: false,
    },
  ];

  const mockPassions = [
    { id: 1, name: 'Adventure' },
    { id: 2, name: 'Coding' },
  ];

  const mockSavedSearches = [
    { id: 1, name: 'My Search', query: 'Alice' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Mock RPCs
    (supabase.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'search_profiles') return Promise.resolve({ data: mockResults, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    // Mock DB queries
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: mockSavedSearches, error: null }),
          })),
          insert: jest.fn().mockResolvedValue({ error: null }),
          delete: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null }),
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

  it('renders search results', async () => {
    render(<SearchPage />);

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.getByText('Explorer')).toBeInTheDocument();
    });
  });

  it('handles search input change', async () => {
    render(<SearchPage />);

    const searchInput = screen.getByPlaceholderText('Name, bio, etc.');
    fireEvent.change(searchInput, { target: { value: 'Bob' } });

    // Wait for debounce and effect
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith(
        'search_profiles',
        expect.objectContaining({ p_query: 'Bob' })
      );
    });
  });

  it('loads saved searches', async () => {
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText('My Search')).toBeInTheDocument();
    });
  });
});
