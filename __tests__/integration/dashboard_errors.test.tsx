import { render, waitFor, act } from '@testing-library/react';
import DashboardClient from '../../src/app/dashboard/DashboardClient';
import { appClient } from '../../src/lib/appClient';

// Mock appClient client
jest.mock('../../src/lib/appClient', () => ({
    appClient: {
        auth: {
            getSession: jest.fn(),
            getUser: jest.fn(),
            onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        },
        from: jest.fn(),
        rpc: jest.fn(),
    },
}));

// Mock next/navigation
const mockRouter = { push: jest.fn() };
jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
}));

describe('Dashboard Error Handling', () => {
    const mockInitialProfile = {
        id: 'user-123',
        first_name: 'John',
        about_me: null,
        passions_count: 5,
        languages_count: 2,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('handles errors in parallel data fetching', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock rpc calls with errors for conversations and suggestions
        (appClient.rpc as jest.Mock).mockImplementation((rpcName) => {
            if (rpcName === 'get_recent_conversations') {
                return Promise.resolve({ data: null, error: { message: 'Convos Error' } });
            }
            if (rpcName === 'get_suggested_profiles') {
                return Promise.resolve({ data: null, error: { message: 'Suggestions Error' } });
            }
            return Promise.resolve({ data: [], error: null });
        });

        // Mock passions fetch with error
        (appClient.from as jest.Mock).mockImplementation((table) => {
            if (table === 'profile_passions') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Passions Error' } })
                    })
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: null })
            };
        });

        await act(async () => {
            render(<DashboardClient userId="user-123" initialProfile={mockInitialProfile} />);
        });

        await waitFor(() => {
            expect(appClient.rpc).toHaveBeenCalledWith('get_recent_conversations', expect.any(Object));
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching conversations:', { message: 'Convos Error' });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching suggestions:', { message: 'Suggestions Error' });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching passions:', { message: 'Passions Error' });
        }, { timeout: 5000 });

        consoleSpy.mockRestore();
    });
});
