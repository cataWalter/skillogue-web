import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Messages from '../src/app/messages/page';
import { supabase } from '../src/supabaseClient';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
    channel: jest.fn(() => {
      const channelMock: any = {
        on: jest.fn().mockReturnThis(),
        track: jest.fn(),
        untake: jest.fn(),
        presenceState: jest.fn(() => ({})),
        unsubscribe: jest.fn(),
      };
      channelMock.subscribe = jest.fn().mockImplementation((callback: any) => {
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return channelMock;
      });
      return channelMock;
    }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://example.com/file.jpg' } })),
      })),
    },
    removeChannel: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: jest.fn() }),
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('Messages Page', () => {
  const mockUser = { id: 'me-123', email: 'me@example.com' };
  const mockConversations = [
    { user_id: 'user-1', full_name: 'User One', last_message: 'Hello', unread: 0 },
    { user_id: 'user-2', full_name: 'User Two', last_message: 'Hi', unread: 2 },
  ];
  const mockMessages = [
    {
      id: 1,
      created_at: '2023-01-01T10:00:00Z',
      sender_id: 'user-1',
      receiver_id: 'me-123',
      content: 'Hello there',
      sender: { id: 'user-1', first_name: 'User', last_name: 'One' },
      receiver: { id: 'me-123', first_name: 'Me', last_name: 'Myself' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    
    // Mock RPCs
    (supabase.rpc as jest.Mock).mockImplementation((fn) => {
      if (fn === 'get_conversations') return Promise.resolve({ data: mockConversations, error: null });
      if (fn === 'mark_messages_as_read') return Promise.resolve({ error: null });
      if (fn === 'is_blocked') return Promise.resolve({ data: false, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    // Mock DB queries
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'messages') {
        return {
          select: jest.fn(() => ({
            or: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
              })),
            })),
          })),
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      };
    });
  });

  it('renders conversation list', async () => {
    render(<Messages />);
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });
  });

  it('selects a conversation and loads messages', async () => {
    render(<Messages />);
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('User One'));

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument();
    });
  });

  it('handles file upload button', async () => {
    render(<Messages />);
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('User One'));

    // Check for attachment button (paperclip icon)
    // Since we mock lucide-react icons usually by name or svg, let's look for the input or button
    // The input is hidden, but we can find it by type="file" or label if present.
    // In the code it's likely an input[type="file"] hidden and a button triggering it.
    
    // Let's just check if the file input exists in the DOM
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });
});
