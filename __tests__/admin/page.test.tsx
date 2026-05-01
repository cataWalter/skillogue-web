
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../src/app/admin/page';
import { adminCopy } from '../../src/lib/app-copy';

const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('react-hot-toast', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

const buildJsonResponse = (body: unknown, ok = true) =>
    Promise.resolve({
        ok,
        json: () => Promise.resolve(body),
    });

const rejectFetch = (value: unknown) =>
    Promise.reject(value) as unknown as ReturnType<typeof buildJsonResponse>;

const baseDashboardPayload = {
    analytics: {
        range: {
            days: 30,
            label: 'Last 30 days',
            trendWindowDays: 30,
        },
        filters: {
            eventType: null,
            path: null,
            availableEventTypes: ['search_submitted', 'message_sent'],
            availablePaths: ['/search', '/messages'],
            exportUrl: '/api/admin/analytics?days=30&export=json',
        },
        overview: {
            totalEvents: 42,
            pageViews: 18,
            uniquePaths: 6,
            lastEventAt: '2026-04-26T12:00:00.000Z',
            totalProfiles: 10,
            verifiedProfiles: 4,
            completedProfiles: 7,
            totalMessages: 12,
            totalFavorites: 9,
        },
        acquisition: {
            signupCompleted: 6,
            emailVerified: 5,
            onboardingCompleted: 4,
            funnel: [
                { label: 'Signups completed', value: 6 },
                { label: 'Emails verified', value: 5 },
            ],
        },
        search: {
            submitted: 8,
            resultsLoaded: 7,
            zeroResults: 1,
            resultClicks: 5,
            savedSearches: 3,
            averageResultsPerSearch: 2.5,
            topQueries: [{ label: 'hiking', value: 3 }],
            topPassions: [{ label: 'Travel', value: 4 }],
            topLocations: [{ label: 'Berlin', value: 2 }],
            topLanguages: [{ label: 'English', value: 4 }],
        },
        engagement: {
            profileViews: 9,
            favoritesAdded: 4,
            favoritesRemoved: 1,
            messageStarted: 3,
            messagesSent: 2,
            funnel: [
                { label: 'Profile views', value: 9 },
                { label: 'Favorites added', value: 4 },
            ],
        },
        notifications: {
            total: 6,
            unread: 2,
            activePushSubscriptions: 3,
            pushEnabled: 2,
            pushDisabled: 1,
            notificationOpened: 4,
        },
        trustAndSafety: {
            totalReports: 2,
            pendingReports: 1,
            openReports: 2,
            reportSubmittedTracked: 2,
            totalVerificationRequests: 3,
            pendingVerificationRequests: 1,
            verificationRequestedTracked: 3,
        },
        content: {
            topPaths: [{ label: '/search', value: 10 }],
            topViewedProfiles: [{ label: 'Alice Example', value: 2 }],
            topPassions: [{ label: 'Travel', value: 4 }],
            topLocations: [{ label: 'Berlin', value: 2 }],
            topLanguages: [{ label: 'English', value: 4 }],
        },
        activity: {
            eventsLast7d: 20,
            eventsLast30d: 35,
            activeDaysLast7d: 5,
            activeDaysLast30d: 12,
            trendWindowDays: 30,
            dailySeries: [
                {
                    date: '2026-04-25',
                    label: 'Apr 25',
                    totalEvents: 10,
                    searches: 3,
                    messages: 2,
                    favorites: 1,
                    profileViews: 2,
                    notifications: 1,
                },
                {
                    date: '2026-04-26',
                    label: 'Apr 26',
                    totalEvents: 12,
                    searches: 4,
                    messages: 3,
                    favorites: 2,
                    profileViews: 1,
                    notifications: 2,
                },
            ],
            peakDay: {
                date: '2026-04-26',
                label: 'Apr 26',
                totalEvents: 12,
            },
        },
        rates: {
            searchClickThroughRate: 62.5,
            zeroResultRate: 12.5,
            verificationRate: 83.3,
            onboardingCompletionRate: 66.7,
            favoritesToMessageRate: 75,
            messageCompletionRate: 66.7,
            pushAdoptionRate: 75,
            notificationOpenRate: 66.7,
        },
        health: {
            score: 86,
            items: [
                {
                    title: 'Analytics feed',
                    status: 'good',
                    detail: '42 events captured in the last 30 days.',
                },
            ],
        },
        eventLeaderboard: [{ label: 'page_view', value: 18 }],
        recentEvents: [
            {
                id: 'event-1',
                eventName: 'search_submitted',
                path: '/search',
                createdAt: '2026-04-26T12:00:00.000Z',
                properties: { query: 'hiking' } as Record<string, unknown>,
            },
        ],
    },
    queues: {
        reports: [
            {
                id: 'report-1',
                reason: 'Spam message',
                status: 'pending',
                createdAt: '2026-04-25T12:00:00.000Z',
                reporterId: 'user-9',
                reportedId: 'user-1',
                reporter: {
                    id: 'user-9',
                    firstName: 'Casey',
                    lastName: 'Reporter',
                    displayName: 'Casey Reporter',
                    verified: false,
                    location: 'Lisbon, Portugal',
                    avatarUrl: null,
                },
                reported: {
                    id: 'user-1',
                    firstName: 'Alice',
                    lastName: 'Example',
                    displayName: 'Alice Example',
                    verified: true,
                    location: 'Berlin, Germany',
                    avatarUrl: null,
                },
            },
        ],
        verificationRequests: [
            {
                id: 'verification-1',
                userId: 'user-2',
                status: 'pending',
                createdAt: '2026-04-24T12:00:00.000Z',
                profile: {
                    id: 'user-2',
                    firstName: 'Bob',
                    lastName: 'Example',
                    displayName: 'Bob Example',
                    verified: false,
                    location: 'Paris, France',
                    avatarUrl: null,
                },
            },
        ],
    },
    quickActions: {
        pendingReports: 1,
        pendingVerificationRequests: 1,
        flaggedUsers: 1,
        unreadNotifications: 2,
        totalQueueItems: 2,
    },
    systemControls: {
        maintenanceBannerText: '',
        analyticsRefreshMinutes: 15,
        moderationHold: false,
        followUpUserIds: ['user-1'],
        updatedAt: '2026-04-26T12:05:00.000Z',
    },
    lastUpdatedAt: '2026-04-26T12:30:00.000Z',
};

describe('AdminDashboard', () => {
    let dashboardPayload: typeof baseDashboardPayload;

    const createFetchImplementation =
        (overrides?: (url: string, method: string, init?: RequestInit) => ReturnType<typeof buildJsonResponse> | undefined) =>
            (input: RequestInfo | URL, init?: RequestInit) => {
                const url = String(input);
                const method = init?.method ?? 'GET';
                const overriddenResponse = overrides?.(url, method, init);
                if (overriddenResponse) return overriddenResponse;

                if (method === 'GET' && url.startsWith('/api/admin/analytics')) {
                    return buildJsonResponse(dashboardPayload);
                }

                throw new Error(`Unhandled fetch for ${method} ${url}`);
            };

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch.mockReset();
        dashboardPayload = JSON.parse(JSON.stringify(baseDashboardPayload));
        mockFetch.mockImplementation(createFetchImplementation());
    });

    const renderDashboard = async () => {
        await act(async () => {
            render(<AdminDashboard />);
        });
    };

    it('shows a loading state initially', () => {
        mockFetch.mockImplementation(() => new Promise(() => { }));

        render(<AdminDashboard />);

        expect(screen.getByText('Loading admin analytics...')).toBeInTheDocument();
    });

    it('renders the admin command center after loading', async () => {
        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: adminCopy.dashboard.title })).toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?days=30', undefined);
        expect(screen.getByRole('link', { name: adminCopy.dashboard.export })).toHaveAttribute(
            'href',
            '/api/admin/analytics?days=30&export=json'
        );
        // Quick-action stat cards
        expect(screen.getAllByText('1').length).toBeGreaterThan(0); // pendingReports, pendingVerification
        // Navigation links
        expect(screen.getByRole('link', { name: /^Queues/i })).toHaveAttribute('href', '/admin/queues');
        expect(screen.getByRole('link', { name: /^Investigations/i })).toHaveAttribute('href', '/admin/users');
        expect(screen.getByRole('link', { name: /^Signals/i })).toHaveAttribute('href', '/admin/signals');
        expect(screen.getByRole('link', { name: /^Controls/i })).toHaveAttribute('href', '/admin/controls');
    });

    it('applies analytics filters and refreshes the dashboard with the filtered URL', async () => {
        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: adminCopy.dashboard.title })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: 'All' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics', undefined);
        });

        fireEvent.change(screen.getAllByRole('combobox')[0], {
            target: { value: 'message_sent' },
        });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?eventType=message_sent', undefined);
            expect(screen.getByText(/Filtered to/i)).toHaveTextContent('message_sent');
        });

        fireEvent.change(screen.getAllByRole('combobox')[1], {
            target: { value: '/messages' },
        });

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?eventType=message_sent&path=%2Fmessages', undefined);
            expect(screen.getByText(/Scoped to/i)).toHaveTextContent('/messages');
        });

        const filteredCalls = () =>
            mockFetch.mock.calls.filter(([url]) => url === '/api/admin/analytics?eventType=message_sent&path=%2Fmessages').length;
        const callsBefore = filteredCalls();

        fireEvent.click(screen.getByRole('button', { name: adminCopy.dashboard.refresh }));

        await waitFor(() => {
            expect(filteredCalls()).toBeGreaterThan(callsBefore);
        });
    });

    it('renders the error state when analytics loading fails', async () => {
        mockFetch.mockImplementation(
            createFetchImplementation((url, method) => {
                if (method === 'GET' && url.startsWith('/api/admin/analytics')) {
                    return buildJsonResponse({ error: 'Analytics unavailable' }, false);
                }
                return undefined;
            })
        );

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Analytics unavailable')).toBeInTheDocument();
        });
    });

    it('falls back to the request URL when analytics errors omit an explicit error message', async () => {
        mockFetch.mockImplementation(
            createFetchImplementation((url, method) => {
                if (method === 'GET' && url.startsWith('/api/admin/analytics')) {
                    return buildJsonResponse({}, false);
                }
                return undefined;
            })
        );

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Request failed for /api/admin/analytics?days=30')).toBeInTheDocument();
        });
    });

    it('renders the generic dashboard error when analytics loading rejects with a non-Error value', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        mockFetch.mockImplementation(
            createFetchImplementation((url, method) => {
                if (method === 'GET' && url.startsWith('/api/admin/analytics')) {
                    return rejectFetch('analytics exploded');
                }
                return undefined;
            })
        );

        await renderDashboard();

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading admin overview:', 'analytics exploded');
            expect(screen.getByText('Failed to fetch admin dashboard.')).toBeInTheDocument();
        });

        consoleErrorSpy.mockRestore();
    });

    it('shows the analytics range label and export link update when the range changes', async () => {
        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Last 30 days')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: '7D' }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/admin/analytics?days=7', undefined);
        });
    });
});
