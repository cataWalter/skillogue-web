import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import SearchPage from '../../src/app/search/page';
import { appClient } from '../../src/lib/appClient';
import '@testing-library/jest-dom';

// Mock App Client client
jest.mock('../../src/lib/appClient', () => ({
  appClient: {
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
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });

    // Default mock for passions
    (appClient.from as jest.Mock).mockImplementation((table) => {
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

    (appClient.rpc as jest.Mock).mockResolvedValue({ data: privateUser, error: null });

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
    (appClient.rpc as jest.Mock).mockRejectedValue(new Error('Search failed'));

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
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });
    
    // Mock save search failure
    (appClient.from as jest.Mock).mockImplementation((table) => {
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
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await act(async () => {
        render(<SearchPage />);
    });

    // Set some filters
    const keywordInput = screen.getByPlaceholderText('Search by name or bio…');
    fireEvent.change(keywordInput, { target: { value: 'Test' } });

    // Wait for "No profiles found" which contains the clear button
    await waitFor(() => {
        expect(screen.getByText('No profiles found matching your criteria.')).toBeInTheDocument();
    });

    const clearButton = screen.getAllByText('Clear all filters')[0];
    
    await act(async () => {
        fireEvent.click(clearButton);
    });

    expect(keywordInput).toHaveValue('');
  });

  it('deletes a saved search', async () => {
      const mockSavedSearch = { id: 1, name: 'To Delete', query: 'test' };
      
      (appClient.from as jest.Mock).mockImplementation((table) => {
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
