import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import Search from '../src/app/search/page';
import { appClient } from '../src/lib/appClient';
import '@testing-library/jest-dom';

const originalConsoleError = console.error;

const flushAsyncEffects = async (cycles = 3) => {
  for (let index = 0; index < cycles; index += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
};

const mockSearchParams = {
  get: jest.fn(),
};

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
  useSearchParams: () => mockSearchParams,
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

const createSavedSearchInsertMock = (result: { data: unknown; error: unknown }) =>
  jest.fn(() => ({
    select: jest.fn(() => ({
      single: jest.fn().mockResolvedValue(result),
    })),
  }));

const createSavedSearchTableMock = ({
  savedSearches = [],
  insertResult = { data: { id: 999, name: 'My Search' }, error: null },
  deleteResult = { error: null },
}: {
  savedSearches?: unknown[];
  insertResult?: { data: unknown; error: unknown };
  deleteResult?: { error: unknown };
} = {}) => ({
  select: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue({ data: savedSearches, error: null }),
  })),
  insert: createSavedSearchInsertMock(insertResult),
  delete: jest.fn(() => ({
    eq: jest.fn().mockResolvedValue(deleteResult),
  })),
});

const renderSearchPage = async () => {
  await act(async () => {
    render(<Search />);
    await flushAsyncEffects(5);
  });

  await waitFor(() => {
    expect(screen.getByText('Discover People')).toBeInTheDocument();
  });
};

const waitForInitialSearchToSettle = async () => {
  await waitFor(() => {
    expect(appClient.rpc).toHaveBeenCalled();
  });

  await act(async () => {
    await flushAsyncEffects(2);
  });
};

const renderLoadedSearchPage = async () => {
  await renderSearchPage();
  await waitForInitialSearchToSettle();
};

describe('Search Page', () => {
  let consoleErrorSpy: jest.SpyInstance;

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
  const mockPagedResults = Array.from({ length: 10 }, (_, index) => ({
    id: String(index + 1),
    first_name: `User${index + 1}`,
    last_name: 'Doe',
    about_me: 'Developer',
    location: 'NYC',
    age: 25 + index,
    gender: 'Male',
    profile_languages: ['English'],
    created_at: `2023-01-${String(index + 1).padStart(2, '0')}`,
    profilepassions: ['Coding'],
    is_private: false,
  }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.get.mockReset();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const stringArgs = args.filter((value): value is string => typeof value === 'string');

      if (
        stringArgs.some((value) => value.includes('not wrapped in act')) ||
        stringArgs.some((value) => value.startsWith('Search error:')) ||
        stringArgs.some((value) => value.startsWith('Error saving search:'))
      ) {
        return;
      }

      originalConsoleError(...(args as Parameters<typeof console.error>));
    });
    window.alert = jest.fn();
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return createSavedSearchTableMock();
      }
      return { select: jest.fn() };
    });
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: mockResults, error: null });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders search form and initial results', async () => {
    await renderLoadedSearchPage();

    expect(screen.getByText('Discover People')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name, bio, etc.')).toBeInTheDocument();
  });

  it('handles performSearch error', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Search error' } });

    await renderLoadedSearchPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to search profiles. Please try again.')).toBeInTheDocument();
    });
  });

  it('handles performSearch unexpected error', async () => {
    (appClient.rpc as jest.Mock).mockRejectedValue(new Error('Network error'));

    await renderLoadedSearchPage();

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('loads more results', async () => {
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({ data: mockPagedResults, error: null })
      .mockResolvedValueOnce({ data: [], error: null });

    await renderLoadedSearchPage();

    expect(screen.getByText('User1 Doe')).toBeInTheDocument();

    const loadMoreButton = screen.getByRole('button', { name: 'Load More' });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledTimes(2);
    });
  });

  it('renders shared fallback placeholders for incomplete search results', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: [
        {
          id: 'fallback-user',
          first_name: null,
          last_name: null,
          about_me: null,
          location: null,
          age: null,
          gender: null,
          profile_languages: [],
          created_at: '2023-01-01',
          profilepassions: [],
          is_private: false,
        },
      ],
      error: null,
    });

    await renderLoadedSearchPage();

    expect(screen.getByText('Skillogue user')).toBeInTheDocument();
    expect(screen.getByText('This user has not added a bio yet.')).toBeInTheDocument();
    expect(screen.getAllByText('Not specified')).toHaveLength(2);
  });

  it('saves search', async () => {
    await renderLoadedSearchPage();

    expect(screen.getByRole('button', { name: 'Save Search' })).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Save Search' });
    fireEvent.click(saveButton);

    const modal = await screen.findByRole('heading', { name: 'Save Search' });
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
        return createSavedSearchTableMock({
          insertResult: { data: null, error: { message: 'Save error' } },
        });
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();

    expect(screen.getByRole('button', { name: 'Save Search' })).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: 'Save Search' });
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
        return createSavedSearchTableMock({ savedSearches: [savedSearch] });
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();

    expect(screen.getByText('Test Search')).toBeInTheDocument();

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
        return createSavedSearchTableMock({ savedSearches: [savedSearch] });
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();

    expect(screen.getByTitle('Delete Search')).toBeInTheDocument();

    const deleteButton = screen.getByTitle('Delete Search');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(appClient.from).toHaveBeenCalledWith('saved_searches');
    });
  });

  it('clears filters', async () => {
    await renderLoadedSearchPage();

    const queryInput = screen.getByPlaceholderText('Name, bio, etc.');
    fireEvent.change(queryInput, { target: { value: 'test query' } });

    const clearButton = await screen.findByRole('button', { name: 'Clear all' });
    fireEvent.click(clearButton);

    // Check if filters are cleared
    expect(queryInput).toHaveValue('');
  });

  it('handles no session for save', async () => {
    (appClient.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });

    await renderLoadedSearchPage();

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Save Search' })).not.toBeInTheDocument();
    });
  });

  it('handles passions fetch error', async () => {
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions error' } }),
        };
      }
      if (table === 'saved_searches') {
        return createSavedSearchTableMock();
      }
      return { select: jest.fn() };
    });

    await renderSearchPage();

    // Should still render, but no passions
    await waitFor(() => {
      expect(screen.getByText('Discover People')).toBeInTheDocument();
    });
  });
});