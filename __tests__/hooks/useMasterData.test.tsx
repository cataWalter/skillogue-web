import { renderHook, waitFor } from '@testing-library/react';
import { useMasterData } from '../../src/hooks/useMasterData';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useMasterData Hook', () => {
    const mockPassions = [{ id: 1, name: 'Coding' }];
    const mockLanguages = [{ id: 1, name: 'English' }];
    const mockLocations = [{ id: 1, city: 'NYC', country: 'USA' }];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch master data on mount', async () => {
        mockFetch.mockImplementation((url) => {
            if (url === '/api/passions') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockPassions) });
            if (url === '/api/languages') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLanguages) });
            if (url === '/api/locations') return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLocations) });
            return Promise.reject(new Error('Unknown URL'));
        });

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.passions).toEqual(mockPassions);
            expect(result.current.languages).toEqual(mockLanguages);
            expect(result.current.locations).toEqual(mockLocations);
            expect(result.current.loading).toBe(false);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/passions');
        expect(mockFetch).toHaveBeenCalledWith('/api/languages');
        expect(mockFetch).toHaveBeenCalledWith('/api/locations');
    });

    it('should handle fetch errors gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('Network error'));

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.passions).toEqual([]);
            expect(result.current.languages).toEqual([]);
            expect(result.current.locations).toEqual([]);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle invalid response', async () => {
        mockFetch.mockResolvedValue({ ok: false });

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.passions).toEqual([]);
            expect(result.current.languages).toEqual([]);
            expect(result.current.locations).toEqual([]);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should handle non-array response', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve('invalid') });

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.passions).toEqual([]);
            expect(result.current.languages).toEqual([]);
            expect(result.current.locations).toEqual([]);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should provide refresh function', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockPassions) });

        await result.current.refresh();

        await waitFor(() => {
            expect(result.current.passions).toEqual(mockPassions);
        });
    });

    it('should handle refresh error', async () => {
        mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });

        const { result } = renderHook(() => useMasterData());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        mockFetch.mockRejectedValue(new Error('Refresh error'));

        await result.current.refresh();

        // Should not crash, data remains
        expect(result.current.passions).toEqual([]);
    });
});