import { act, render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
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

const baseDashboardPayload = {
    overview: {
        totalProfiles: 10,
        verifiedProfiles: 4,
        completedProfiles: 7,
        totalMessages: 12,
        totalFavorites: 9,
        totalNotifications: 6,
        unreadNotifications: 2,
        activePushSubscriptions: 3,
        totalReports: 2,
        pendingReports: 1,
        totalVerificationRequests: 3,
        pendingVerificationRequests: 1,
    },
    queues: {
        reports: [
            {
                id: 'report-1',
                reason: 'Spam message',
                status: 'pending',
                createdAt: '2026-04-25T12:00:00.000Z',
                reporter: {
                    id: 'user-9',
                    displayName: 'Casey Reporter',
                    verified: false,
                    location: 'Lisbon, Portugal',
                    avatarUrl: null,
                },
                reported: {
                    id: 'user-1',
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
        moderationHold: false,
        followUpUserIds: ['user-1'],
        updatedAt: '2026-04-26T12:05:00.000Z',
    },
    lastUpdatedAt: '2026-04-26T12:30:00.000Z',
};

const buildJsonResponse = (body: unknown, ok = true) =>
    Promise.resolve({
        ok,
        json: () => Promise.resolve(body),
    });

const rejectFetch = (value: unknown) =>
    Promise.reject(value) as unknown as ReturnType<typeof buildJsonResponse>;

describe('AdminDashboard', () => {
    let dashboardPayload: typeof baseDashboardPayload;

    const createFetchImplementation =
        (overrides?: (url: string) => ReturnType<typeof buildJsonResponse> | undefined) =>
            (input: RequestInfo | URL, _init?: RequestInit) => {
                const url = String(input);
                const overriddenResponse = overrides?.(url);
                if (overriddenResponse) return overriddenResponse;
                if (url === '/api/admin/dashboard') {
                    return buildJsonResponse(dashboardPayload);
                }
                throw new Error(`Unhandled fetch for ${url}`);
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
        expect(screen.getByText('Loading admin dashboard...')).toBeInTheDocument();
    });

    it('renders the admin dashboard after loading', async () => {
        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: adminCopy.dashboard.title })).toBeInTheDocument();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/admin/dashboard', undefined);
        expect(screen.getAllByText('1').length).toBeGreaterThan(0);
        expect(screen.getByRole('link', { name: /queues/i })).toHaveAttribute('href', '/admin/queues');
        expect(screen.getByRole('link', { name: /investigations/i })).toHaveAttribute('href', '/admin/users');
        expect(screen.getByRole('link', { name: /controls/i })).toHaveAttribute('href', '/admin/controls');
    });

    it('refreshes the dashboard when the refresh button is clicked', async () => {
        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: adminCopy.dashboard.title })).toBeInTheDocument();
        });

        const callsBefore = mockFetch.mock.calls.length;
        fireEvent.click(screen.getByRole('button', { name: adminCopy.dashboard.refresh }));

        await waitFor(() => {
            expect(mockFetch.mock.calls.length).toBeGreaterThan(callsBefore);
        });
    });

    it('renders the error state when dashboard loading fails', async () => {
        mockFetch.mockImplementation(
            createFetchImplementation((url) => {
                if (url === '/api/admin/dashboard') {
                    return buildJsonResponse({ error: 'Dashboard unavailable' }, false);
                }
                return undefined;
            })
        );

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Dashboard unavailable')).toBeInTheDocument();
        });
    });

    it('renders the generic error when dashboard loading rejects', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        mockFetch.mockImplementation(
            createFetchImplementation((url) => {
                if (url === '/api/admin/dashboard') {
                    return rejectFetch('dashboard exploded');
                }
                return undefined;
            })
        );

        await renderDashboard();

        await waitFor(() => {
            expect(screen.getByText('Failed to fetch admin dashboard.')).toBeInTheDocument();
        });

        consoleErrorSpy.mockRestore();
    });
});
