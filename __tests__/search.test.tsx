import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Search from '../src/app/search/page';
import { appClient } from '../src/lib/appClient';
import '@testing-library/jest-dom';

// Mock App Client client
jest.mock('../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock components
jest.mock('../src/components/MultiSelect', () => ({
  __esModule: true,
  default: ({ selected, onChange }: { selected: string[], onChange: (v: string[]) => void }) => (
    <div data-testid="multiselect">
      {selected.map(s => <span key={s}>{s}</span>)}
      <button onClick={() => onChange(['test'])}>Add</button>
    </div>
  ),
}));

jest.mock('../src/components/SearchSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="search-skeleton">Skeleton</div>,
}));

describe('Search Page', () => {
  const mockSession = { user: { id: 'user-123' } };
  const mockPassions = [
    { id: 1, name: 'Coding' },
    { id: 2, name: 'Music' },
  ];
  const mockResults = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      about_me: 'Developer',
      location: 'NYC',
      age: 25,
      gender: 'Male',
      profile_languages: ['English'],
      created_at: '2023-01-01',
      profilepassions: ['Coding'],
      is_private: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
          insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          delete: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return { select: jest.fn() };
    });
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockResults, error: null });
  });

  it('renders search form and initial results', async () => {
    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Discover People')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name, bio, etc.')).toBeInTheDocument();
    });
  });

  it('handles performSearch error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Search error' } });

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Failed to search profiles. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles performSearch unexpected error', async () => {
    (appClient.rpc as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('loads more results', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({ data: mockResults, error: null }).mockResolvedValueOnce({ data: [], error: null });

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledTimes(2);
    });
  });

  it('saves search', async () => {
    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Save Search')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Search');
    fireEvent.click(saveButton);

    const modal = await screen.findByText('Save Search');
    expect(modal).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Give this search a name...');
    fireEvent.change(input, { target: { value: 'My Search' } });

    const confirmButton = screen.getByText('Save');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(appClient.from).toHaveBeenCalledWith('saved_searches');
    });
  });

  it('handles save search error', async () => {
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          })),
          insert: jest.fn().mockResolvedValue({ data: null, error: { message: 'Save error' } }),
        };
      }
      return { select: jest.fn() };
    });

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Save Search')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Search');
    fireEvent.click(saveButton);

    const input = await screen.findByPlaceholderText('Give this search a name...');
    fireEvent.change(input, { target: { value: 'My Search' } });

    const confirmButton = screen.getByText('Save');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Failed to save search');
    });
  });

  it('loads saved search', async () => {
    const savedSearch = {
      id: 1,
      name: 'Test Search',
      query: 'test',
      location: 'NYC',
      min_age: 20,
      max_age: 30,
      language: 'English',
      gender: 'Male',
      passion_ids: [1],
    };

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [savedSearch], error: null }),
          })),
        };
      }
      return { select: jest.fn() };
    });

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Test Search')).toBeInTheDocument();
    });

    const savedSearchButton = screen.getByText('Test Search');
    fireEvent.click(savedSearchButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue('test')).toBeInTheDocument();
    });
  });

  it('deletes saved search', async () => {
    const savedSearch = {
      id: 1,
      name: 'Test Search',
      query: null,
      location: null,
      min_age: null,
      max_age: null,
      language: null,
      gender: null,
      passion_ids: null,
    };

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: [savedSearch], error: null }),
          })),
          delete: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return { select: jest.fn() };
    });

    render(<Search />);

    await waitFor(() => {
      expect(screen.getByTitle('Delete Search')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('Delete Search');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(appClient.from).toHaveBeenCalledWith('saved_searches');
    });
  });

  it('clears filters', async () => {
    render(<Search />);

    await waitFor(() => {
      expect(screen.getByText('Clear all filters')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear all filters');
    fireEvent.click(clearButton);

    // Check if filters are cleared
    const queryInput = screen.getByPlaceholderText('Name, bio, etc.');
    expect(queryInput).toHaveValue('');
  });

  it('handles no session for save', async () => {
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });

    render(<Search />);

    await waitFor(() => {
      expect(screen.queryByText('Save Search')).not.toBeInTheDocument();
    });
  });

  it('handles passions fetch error', async () => {
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions error' } }),
        };
      }
      return { select: jest.fn() };
    });

    render(<Search />);

    // Should still render, but no passions
    await waitFor(() => {
      expect(screen.getByText('Discover People')).toBeInTheDocument();
    });
  });
});