import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserProfile from '../src/app/user/[id]/page';
import { supabase } from '../src/supabaseClient';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../src/supabaseClient', () => ({
  supabase: {
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
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('UserProfile', () => {
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
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    
    // Mock profile fetch
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
            })),
          })),
        };
      }
      if (table === 'profile_passions' || table === 'profile_languages') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      };
    });

    // Mock RPCs
    (supabase.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
      if (fn === 'is_saved') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('renders user profile', async () => {
    render(<UserProfile />);
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('About Jane')).toBeInTheDocument();
    });
  });

  it('handles blocking a user', async () => {
    window.confirm = jest.fn(() => true);
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByTitle('Block User')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Block User'));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('block_user', { target_id: 'user-123' });
    });
  });

  it('handles saving a user', async () => {
    render(<UserProfile />);
    
    await waitFor(() => {
      expect(screen.getByTitle('Add to Favorites')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Add to Favorites'));

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('save_profile', { target_id: 'user-123' });
    });
  });
});
