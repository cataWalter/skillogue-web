import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useAuth Hook', () => {
    const mockSession = {
        user: { id: '123', email: 'test@example.com' },
        expires: '2024-01-01',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return initial loading state', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());
        
        // Initially loading is true before effect runs
        expect(result.current.loading).toBe(true);
        
        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it('should fetch session on mount', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session).toEqual(mockSession);
            expect(result.current.user).toEqual(mockSession.user);
            expect(result.current.loading).toBe(false);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/session');
    });

    it('should handle fetch error gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    it('should provide signIn function', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.signIn).toBeDefined();
        expect(typeof result.current.signIn).toBe('function');
    });

    it('should provide signUp function', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.signUp).toBeDefined();
        expect(typeof result.current.signUp).toBe('function');
    });

    it('should provide signOut function', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.signOut).toBeDefined();
        expect(typeof result.current.signOut).toBe('function');
    });

    it('should provide resetPassword function', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.resetPassword).toBeDefined();
        expect(typeof result.current.resetPassword).toBe('function');
    });

    it('should provide refresh function', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.refresh).toBeDefined();
        expect(typeof result.current.refresh).toBe('function');
    });

    it('should sign in successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await result.current.signIn('test@example.com', 'password123');

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/sign-in/email', expect.objectContaining({
            method: 'POST',
        }));
    });

    it('should handle sign in error', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: 'Invalid credentials' }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await expect(result.current.signIn('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });

    it('should sign up successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ user: { id: '123', email: 'test@example.com' } }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        const response = await result.current.signUp('test@example.com', 'password123');

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/sign-up/email', expect.objectContaining({
            method: 'POST',
        }));
        expect(response).toEqual({ user: { id: '123', email: 'test@example.com' } });
    });

    it('should handle invalid session response', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            // no json method
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    it('should handle refresh error', async () => {
        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ session: null }),
            })
            .mockRejectedValueOnce(new Error('Refresh error'));

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.refresh();
        });

        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
    });

    it('should not set state if unmounted during session load', async () => {
        let resolveFetch;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        mockFetch.mockReturnValue(fetchPromise);

        const { result, unmount } = renderHook(() => useAuth());

        // Unmount before fetch resolves
        unmount();

        // Now resolve the fetch
        resolveFetch({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        // Wait a bit to ensure async completes
        await new Promise(resolve => setTimeout(resolve, 10));

        // State should not have changed because active was false
        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });

    it('should not set state if unmounted during session load error', async () => {
        let rejectFetch;
        const fetchPromise = new Promise((_, reject) => {
            rejectFetch = reject;
        });
        mockFetch.mockReturnValue(fetchPromise);

        const { result, unmount } = renderHook(() => useAuth());

        unmount();

        rejectFetch(new Error('Network error'));

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });

    it('should handle sign up error', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: 'User already exists' }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await expect(result.current.signUp('test@example.com', 'password123')).rejects.toThrow('User already exists');
    });

    it('should sign out successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.session).toEqual(mockSession);
        });

        mockFetch.mockResolvedValue({ ok: true });
        await act(async () => {
            await result.current.signOut();
        });

        await waitFor(() => {
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    it('should reset password successfully', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await result.current.resetPassword('test@example.com');

        expect(mockFetch).toHaveBeenCalledWith('/api/auth/reset-password', expect.objectContaining({
            method: 'POST',
        }));
    });

    it('should handle reset password error', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            json: () => Promise.resolve({ message: 'User not found' }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await expect(result.current.resetPassword('test@example.com')).rejects.toThrow('User not found');
    });

    it('should refresh session', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session?.user.email).toBe('test@example.com');
        });

        const newSession = { ...mockSession, user: { ...mockSession.user, email: 'new@example.com' } };
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: newSession }),
        });

        await act(async () => {
            await result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.session?.user.email).toBe('new@example.com');
        });
    });

    it('should handle readSession invalid response', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: null, // Invalid
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle readSession with no session in data', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ session: null }),
        });

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle refresh error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        }).mockRejectedValueOnce(new Error('Refresh error'));

        const { result } = renderHook(() => useAuth());

        await waitFor(() => {
            expect(result.current.session?.user.email).toBe('test@example.com');
        });

        await act(async () => {
            await result.current.refresh();
        });

        await waitFor(() => {
            expect(result.current.session).toBeNull();
            expect(result.current.user).toBeNull();
        });
    });

    it('should not set state if unmounted during session load', async () => {
        let resolveFetch;
        const fetchPromise = new Promise((resolve) => {
            resolveFetch = resolve;
        });
        mockFetch.mockReturnValue(fetchPromise);

        const { result, unmount } = renderHook(() => useAuth());

        // Unmount before fetch resolves
        unmount();

        // Now resolve the fetch
        resolveFetch({
            ok: true,
            json: () => Promise.resolve({ session: mockSession }),
        });

        // Wait a bit to ensure async completes
        await new Promise(resolve => setTimeout(resolve, 10));

        // State should not have changed because active was false
        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });

    it('should not set state if unmounted during session load error', async () => {
        let rejectFetch;
        const fetchPromise = new Promise((_, reject) => {
            rejectFetch = reject;
        });
        mockFetch.mockReturnValue(fetchPromise);

        const { result, unmount } = renderHook(() => useAuth());

        unmount();

        rejectFetch(new Error('Network error'));

        await new Promise(resolve => setTimeout(resolve, 10));

        expect(result.current.session).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(true);
    });
});
