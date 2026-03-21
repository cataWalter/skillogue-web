import { render, screen, waitFor, act } from '@testing-library/react';
import Dashboard from '../../src/app/dashboard/page';
import { supabase } from '../../src/supabaseClient';

// Mock supabase client
jest.mock('../../src/supabaseClient', () => ({
    supabase: {
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
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockSession = {
        user: mockUser,
        access_token: 'token',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession }, error: null });
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('handles errors in parallel data fetching', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        // Mock successful profile fetch
        const mockProfile = {
            first_name: 'John',
            last_name: 'Doe',
            passions_count: [{ count: 5 }],
            languages_count: [{ count: 2 }],
        };

        // Mock rpc calls with errors for conversations and suggestions
        (supabase.rpc as jest.Mock).mockImplementation((rpcName) => {
            if (rpcName === 'get_user_profile_with_counts') {
                return Promise.resolve({ data: mockProfile, error: null });
            }
            if (rpcName === 'get_recent_conversations') {
                return Promise.resolve({ data: null, error: { message: 'Convos Error' } });
            }
            if (rpcName === 'get_suggested_profiles') {
                return Promise.resolve({ data: null, error: { message: 'Suggestions Error' } });
            }
            return Promise.resolve({ data: [], error: null });
        });

        // Mock passions fetch with error
        (supabase.from as jest.Mock).mockImplementation((table) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnValue({
                        eq: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                        })
                    })
                };
            }
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
            render(<Dashboard />);
        });

        screen.debug();

        await waitFor(() => {
            expect(supabase.rpc).toHaveBeenCalledWith('get_recent_conversations', expect.any(Object));
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching conversations:', { message: 'Convos Error' });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching suggestions:', { message: 'Suggestions Error' });
            expect(consoleSpy).toHaveBeenCalledWith('Error fetching passions:', { message: 'Passions Error' });
        }, { timeout: 5000 });

        consoleSpy.mockRestore();
    });
});
