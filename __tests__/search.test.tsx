import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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
  default: ({
    options,
    selected,
    onChange,
  }: {
    options?: Array<{ id: number; name: string }>;
    selected: string[];
    onChange: (v: string[]) => void;
  }) => (
    <div data-testid="multiselect">
      {selected.map(s => <span key={s}>{s}</span>)}
      <button onClick={() => onChange([options?.[0]?.name ?? 'test'])}>Add</button>
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
        stringArgs.some((value) => value.startsWith('Error saving search:')) ||
        stringArgs.some((value) => value.includes('Not implemented: navigation')) ||
        args.some((value) => String(value).includes('Not implemented: navigation'))
      ) {
        return;
      }

      originalConsoleError(...(args as Parameters<typeof console.error>));
    });
    window.alert = jest.fn();
    jest.spyOn(require('react-hot-toast').default, 'error').mockImplementation(() => { });
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
    expect(screen.getByPlaceholderText('Search by name or bio…')).toBeInTheDocument();
  });

  it('treats null search results as an empty result set', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

    await renderLoadedSearchPage();

    expect(screen.getByText('No profiles found matching your criteria.')).toBeInTheDocument();
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

  it('saves selected passions with the saved search payload', async () => {
    const savedSearchTable = createSavedSearchTableMock();

    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return savedSearchTable;
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }));

    const input = await screen.findByPlaceholderText('Give this search a name...');
    fireEvent.change(input, { target: { value: 'Coding Search' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(savedSearchTable.insert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Coding Search',
        passion_ids: [1],
      }));
    });
  });

  it('does not persist a saved search when the name is blank', async () => {
    const savedSearchTable = createSavedSearchTableMock();
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return savedSearchTable;
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(savedSearchTable.insert).not.toHaveBeenCalled();
    });
  });

  it('serializes age filters when saving a search', async () => {
    const savedSearchTable = createSavedSearchTableMock();
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return savedSearchTable;
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();
    fireEvent.change(screen.getByLabelText('Min Age'), { target: { value: '21' } });
    fireEvent.change(screen.getByLabelText('Max Age'), { target: { value: '34' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }));
    fireEvent.change(screen.getByPlaceholderText('Give this search a name...'), { target: { value: 'Age Filter' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(savedSearchTable.insert).toHaveBeenCalledWith(expect.objectContaining({
        min_age: 21,
        max_age: 34,
      }));
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
      expect(require('react-hot-toast').default.error).toHaveBeenCalledWith('Failed to save search');
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

  it('clears selected passions when a saved search has no passion ids', async () => {
    mockSearchParams.get.mockReturnValue('Coding');
    const savedSearch = {
      id: 1,
      name: 'Blank Search',
      query: '',
      location: '',
      min_age: null,
      max_age: null,
      language: '',
      gender: '',
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
    expect(within(screen.getByTestId('multiselect')).getByText('Coding')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Blank Search'));

    await waitFor(() => {
      expect(within(screen.getByTestId('multiselect')).queryByText('Coding')).not.toBeInTheDocument();
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

    const queryInput = screen.getByPlaceholderText('Search by name or bio…');
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

  it('treats null saved searches as an empty saved-search list', async () => {
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          })),
          insert: createSavedSearchInsertMock({ data: { id: 999, name: 'My Search' }, error: null }),
          delete: jest.fn(() => ({
            eq: jest.fn().mockResolvedValue({ error: null }),
          })),
        };
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();

    expect(screen.queryByText('Saved Searches')).not.toBeInTheDocument();
  });

  it('shows zero-results message for empty search results', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({ data: [], error: null });

    await renderLoadedSearchPage();

    expect(screen.getByText('No profiles found matching your criteria.')).toBeInTheDocument();
  });

  it('renders public and private profile cards from search results', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValue({
      data: [
        mockResults[0],
        {
          id: '2',
          first_name: 'Jane',
          last_name: 'Roe',
          about_me: 'Private profile',
          location: 'Paris',
          age: 27,
          gender: 'Female',
          profile_languages: ['French'],
          created_at: '2023-01-02',
          profilepassions: ['Music'],
          is_private: true,
        },
      ],
      error: null,
    });

    await renderLoadedSearchPage();
    expect(screen.getByText('Private Profile')).toBeInTheDocument();
  });

  it('updates the sort selector after results load', async () => {
    await renderLoadedSearchPage();

    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'passions' } });

    expect(sortSelect).toHaveValue('passions');
  });

  it('merges duplicate and new results when loading more pages', async () => {
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({ data: mockPagedResults, error: null })
      .mockResolvedValueOnce({
        data: [
          {
            ...mockPagedResults[0],
            first_name: 'Merged',
          },
          {
            id: '11',
            first_name: 'User11',
            last_name: 'Doe',
            about_me: 'Developer',
            location: 'NYC',
            age: 36,
            gender: 'Male',
            profile_languages: ['English'],
            created_at: '2023-01-11',
            profilepassions: ['Coding'],
            is_private: false,
          },
        ],
        error: null,
      });

    await renderLoadedSearchPage();
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }));

    await waitFor(() => {
      expect(screen.getByText('Merged Doe')).toBeInTheDocument();
      expect(screen.getByText('User11 Doe')).toBeInTheDocument();
    });
    expect(screen.queryByText('User1 Doe')).not.toBeInTheDocument();
  });

  it('clears individual active filter chips', async () => {
    await renderLoadedSearchPage();

    const queryInput = screen.getByPlaceholderText('Search by name or bio…');
    const locationInput = screen.getByPlaceholderText('City, Country');
    const minAgeInput = screen.getByLabelText('Min Age');
    const maxAgeInput = screen.getByLabelText('Max Age');
    const genderSelect = screen.getByLabelText('Gender');
    const languageInput = screen.getByPlaceholderText('Select languages\u2026');

    fireEvent.change(queryInput, { target: { value: 'test query' } });
    fireEvent.change(locationInput, { target: { value: 'NYC' } });
    fireEvent.change(minAgeInput, { target: { value: '20' } });
    fireEvent.change(maxAgeInput, { target: { value: '30' } });
    fireEvent.change(genderSelect, { target: { value: 'Male' } });
    fireEvent.change(languageInput, { target: { value: 'English' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const activeFiltersPanel = screen.getByText('Active Filters').closest('div')?.parentElement as HTMLElement;

    fireEvent.click(within(within(activeFiltersPanel).getByText(/Search: test query/i).closest('span') as HTMLElement).getByRole('button'));
    fireEvent.click(within(within(activeFiltersPanel).getByText('NYC').closest('span') as HTMLElement).getByRole('button'));
    fireEvent.click(within(within(activeFiltersPanel).getByText(/Age: 20-30/i).closest('span') as HTMLElement).getByRole('button'));
    fireEvent.click(within(within(activeFiltersPanel).getByText('Male').closest('span') as HTMLElement).getByRole('button'));
    fireEvent.click(within(within(activeFiltersPanel).getByText('English').closest('span') as HTMLElement).getByRole('button'));
    fireEvent.click(within(within(activeFiltersPanel).getByText('Coding').closest('span') as HTMLElement).getByRole('button'));

    await waitFor(() => {
      expect(queryInput).toHaveValue('');
      expect(locationInput).toHaveValue('');
      expect(minAgeInput).toHaveValue(null);
      expect(maxAgeInput).toHaveValue(null);
      expect(genderSelect).toHaveValue('');
      expect(languageInput).toHaveValue('');
      expect(screen.queryByText('Coding')).not.toBeInTheDocument();
    });
  });

  it('renders a single-ended age chip when only one age filter is set', async () => {
    await renderLoadedSearchPage();
    fireEvent.change(screen.getByLabelText('Min Age'), { target: { value: '20' } });

    expect(screen.getByText(/Age: 20/i)).toBeInTheDocument();
    expect(screen.queryByText(/Age: 20-20/i)).not.toBeInTheDocument();
  });

  it('renders a single-ended age chip when only the max age filter is set', async () => {
    await renderLoadedSearchPage();
    fireEvent.change(screen.getByLabelText('Max Age'), { target: { value: '35' } });

    expect(screen.getByText(/Age: 35/i)).toBeInTheDocument();
    expect(screen.queryByText(/Age: 35-35/i)).not.toBeInTheDocument();
  });

  it('retries the search from the error state', async () => {
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({ data: null, error: { message: 'Search error' } })
      .mockResolvedValueOnce({ data: mockResults, error: null });

    await renderLoadedSearchPage();
    expect(screen.getByText('Failed to search profiles. Please try again.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Failed to search profiles. Please try again.')).not.toBeInTheDocument();
    });
    expect(appClient.rpc).toHaveBeenCalledTimes(2);
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

  it('closes the save-search modal without persisting anything', async () => {
    const savedSearchTable = createSavedSearchTableMock();
    (appClient.from as jest.Mock).mockImplementation((table) => {
      if (table === 'passions') {
        return {
          select: jest.fn().mockResolvedValue({ data: mockPassions, error: null }),
        };
      }
      if (table === 'saved_searches') {
        return savedSearchTable;
      }
      return { select: jest.fn() };
    });

    await renderLoadedSearchPage();
    fireEvent.click(screen.getByRole('button', { name: 'Save Search' }));

    expect(screen.getByRole('heading', { name: 'Save Search' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Save Search' })).not.toBeInTheDocument();
    });
    expect(savedSearchTable.insert).not.toHaveBeenCalled();
  });
});
