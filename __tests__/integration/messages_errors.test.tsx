import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import MessagesPage from '../../src/app/messages/page';
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
    channel: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockReturnThis(),
        track: jest.fn(),
        presenceState: jest.fn().mockReturnValue({}),
        unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: jest.fn() }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Messages Page Error Handling', () => {
  const mockUser = { id: 'user-123' };
  const mockSession = { user: mockUser };
  const mockConversations = [
      {
          user_id: 'user-2',
          full_name: 'Alice Wonderland',
          first_name: 'Alice',
          last_name: 'Wonderland',
          last_message: 'Hello',
          last_message_time: new Date().toISOString(),
          unread_count: 0
      }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Default mocks
    (supabase.rpc as jest.Mock).mockImplementation((fn) => {
        if (fn === 'get_conversations') return Promise.resolve({ data: mockConversations, error: null });
        if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
        return Promise.resolve({ data: [], error: null });
    });

    (supabase.from as jest.Mock).mockImplementation((table) => {
        return {
            select: jest.fn(() => ({
                or: jest.fn(() => ({
                    order: jest.fn(() => ({
                        range: jest.fn().mockResolvedValue({ data: [], error: null })
                    }))
                })),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null })
            })),
            insert: jest.fn().mockResolvedValue({ error: null }),
            update: jest.fn().mockResolvedValue({ error: null }),
        };
    });
  });

  it('handles message load error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock conversations success but messages failure
      (supabase.from as jest.Mock).mockImplementation((table) => {
          if (table === 'messages') {
              return {
                  select: jest.fn(() => ({
                      or: jest.fn(() => ({
                          order: jest.fn(() => ({
                              range: jest.fn().mockResolvedValue({ data: null, error: { message: 'Load failed' } })
                          }))
                      }))
                  }))
              };
          }
          return { select: jest.fn() };
      });

      await act(async () => {
          render(<MessagesPage />);
      });

      // Click on a conversation to trigger message load
      await waitFor(() => {
          expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      });

      await act(async () => {
          fireEvent.click(screen.getByText('Alice Wonderland'));
      });

      await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Error loading messages:', expect.objectContaining({ message: 'Load failed' }));
      });

      consoleSpy.mockRestore();
  });

  it('handles send message error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock message load success
      (supabase.from as jest.Mock).mockImplementation((table) => {
          if (table === 'messages') {
              return {
                  select: jest.fn(() => ({
                      or: jest.fn(() => ({
                          order: jest.fn(() => ({
                              range: jest.fn().mockResolvedValue({ data: [], error: null })
                          }))
                      }))
                  })),
                  insert: jest.fn().mockResolvedValue({ error: { message: 'Send failed' } })
              };
          }
          return { select: jest.fn() };
      });

      await act(async () => {
          render(<MessagesPage />);
      });

      // Select chat
      await waitFor(() => {
          fireEvent.click(screen.getByText('Alice Wonderland'));
      });

      // Type and send message
      const input = screen.getByPlaceholderText('Type a message...');
      fireEvent.change(input, { target: { value: 'Hello' } });
      
      await act(async () => {
          fireEvent.submit(input.closest('form')!);
      });

      await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Error sending message:', expect.objectContaining({ message: 'Send failed' }));
          expect(alertSpy).toHaveBeenCalledWith('Failed to send message');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
  });

  it('handles block user error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

      (supabase.rpc as jest.Mock).mockImplementation((fn) => {
          if (fn === 'get_conversations') return Promise.resolve({ data: mockConversations, error: null });
          if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
          if (fn === 'block_user') return Promise.resolve({ error: { message: 'Block failed' } });
          return Promise.resolve({ data: [], error: null });
      });

      await act(async () => {
          render(<MessagesPage />);
      });

      // Select chat
      await waitFor(() => {
          fireEvent.click(screen.getByText('Alice Wonderland'));
      });

      // Find block button
      const blockButton = screen.getByTitle('Block User');
      
      await act(async () => {
          fireEvent.click(blockButton);
      });

      await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Error blocking user:', expect.objectContaining({ message: 'Block failed' }));
          expect(alertSpy).toHaveBeenCalledWith('Failed to block user');
      });

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
      confirmSpy.mockRestore();
  });
});
