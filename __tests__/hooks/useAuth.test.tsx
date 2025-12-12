import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/supabaseClient';

// Mock supabase client
jest.mock('../../src/supabaseClient', () => ({
    supabase: {
        auth: {
            getSession: jest.fn(),
            onAuthStateChange: jest.fn(),
        },
    },
}));

describe('useAuth Hook', () => {
    const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'token',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return initial loading state', async () => {
        // Mock getSession to never resolve immediately to test initial state if needed,
        // but renderHook waits for effects. 
        // We can mock it to resolve.
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
        (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
        });

        const { result } = renderHook(() => useAuth());
        
        // Initially loading might be true before effect runs
        expect(result.current.loading).toBe(true);
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('should fetch session on mount', async () => {
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: mockSession } });
        (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
            data: { subscription: { unsubscribe: jest.fn() } },
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session).toEqual(mockSession);
            expect(result.current.user).toEqual(mockSession.user);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle auth state changes', async () => {
        (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
        
        // Mock onAuthStateChange to trigger the callback immediately
        (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
            callback('SIGNED_IN', mockSession);
            return { data: { subscription: { unsubscribe: jest.fn() } } };
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session).toEqual(mockSession);
            expect(result.current.user).toEqual(mockSession.user);
        });
    });
});
