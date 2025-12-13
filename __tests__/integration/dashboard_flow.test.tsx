import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../src/app/dashboard/page';
import { supabase } from '../../src/supabaseClient';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../../src/supabaseClient', () => ({
  supabase: {
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
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });

    // Mock RPCs
    (supabase.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_recent_conversations') return Promise.resolve({ data: mockConversations, error: null });
      if (fn === 'get_suggested_profiles') return Promise.resolve({ data: mockSuggestions, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    // Mock DB queries
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

    // Verify conversations are loaded
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();

    // Verify suggestions are loaded
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('redirects to onboarding if profile is incomplete', async () => {
    // Mock incomplete profile
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: { ...mockProfile, first_name: null }, error: null }),
            })),
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
      expect(mockPush).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('redirects to login if not authenticated', async () => {
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });

    render(<Dashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
