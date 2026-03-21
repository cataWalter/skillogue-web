import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('Search Page Error Handling and Edge Cases', () => {
  const mockUser = { id: 'user-123' };
  const mockSession = { user: mockUser };
  
  const mockPassions = [
    { id: 1, name: 'Adventure' },
    { id: 2, name: 'Coding' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Default mock for passions
    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
          return {
              select: jest.fn(() => ({
                  eq: jest.fn().mockResolvedValue({ data: [], error: null })
              })),
              insert: jest.fn(),
              delete: jest.fn(),
          }
      }
      return {
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    });
  });

  it('renders private user correctly', async () => {
    const privateUser = [{
      id: 'user-private',
      first_name: 'Secret',
      last_name: 'Agent',
      is_private: true,
      profile_languages: [],
      profilepassions: [],
    }];

    (supabase.rpc as jest.Mock).mockResolvedValue({ data: privateUser, error: null });

    await act(async () => {
        render(<SearchPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Secret Agent')).toBeInTheDocument();
      expect(screen.getByText('Private Profile')).toBeInTheDocument();
    });
  });

  it('handles search error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Search failed'));

    await act(async () => {
        render(<SearchPage />);
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Search error:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('handles save search error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock successful search first to enable save button
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
    
    // Mock save search failure
    (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'passions') {
            return { select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }) };
        }
        if (table === 'saved_searches') {
            return {
                select: jest.fn(() => ({
                    eq: jest.fn().mockResolvedValue({ data: [], error: null })
                })),
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Save failed' } })
                    })
                })
            };
        }
        return { select: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })) };
    });

    await act(async () => {
        render(<SearchPage />);
    });

    // Open save modal
    const saveButton = screen.getByText('Save Search');
    fireEvent.click(saveButton);

    // Fill form and submit
    const nameInput = screen.getByPlaceholderText('Give this search a name...');
    fireEvent.change(nameInput, { target: { value: 'My Failed Search' } });
    
    const confirmButton = screen.getByText('Save');
    await act(async () => {
        fireEvent.click(confirmButton);
    });

    await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving search:', expect.objectContaining({ message: 'Save failed' }));
        expect(alertSpy).toHaveBeenCalledWith('Failed to save search');
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('clears all filters', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await act(async () => {
        render(<SearchPage />);
    });

    // Set some filters
    const keywordInput = screen.getByPlaceholderText('Name, bio, etc.');
    fireEvent.change(keywordInput, { target: { value: 'Test' } });

    // Wait for "No profiles found" which contains the clear button
    await waitFor(() => {
        expect(screen.getByText('No profiles found matching your criteria.')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear all filters');
    
    await act(async () => {
        fireEvent.click(clearButton);
    });

    expect(keywordInput).toHaveValue('');
  });

  it('deletes a saved search', async () => {
      const mockSavedSearch = { id: 1, name: 'To Delete', query: 'test' };
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'passions') return { select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }) };
        if (table === 'saved_searches') {
            return {
                select: jest.fn(() => ({
                    eq: jest.fn().mockResolvedValue({ data: [mockSavedSearch], error: null })
                })),
                delete: jest.fn(() => ({
                    eq: jest.fn().mockResolvedValue({ error: null })
                }))
            };
        }
        return { select: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ data: [], error: null }) })) };
      });

      await act(async () => {
          render(<SearchPage />);
      });

      await waitFor(() => {
          expect(screen.getByText('To Delete')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTitle('Delete Search');
      
      await act(async () => {
          fireEvent.click(deleteButton);
      });

      await waitFor(() => {
          expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
      });
  });
});
