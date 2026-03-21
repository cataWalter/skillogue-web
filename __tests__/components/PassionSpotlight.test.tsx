import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PassionSpotlight from '../../src/components/PassionSpotlight';
import { supabase } from '../../src/supabaseClient';

// Mock dependencies
jest.mock('../../src/supabaseClient', () => ({
    supabase: {
        rpc: jest.fn(),
    },
}));

describe('PassionSpotlight Component', () => {
    const mockUserPassions = [
        { passion_id: 1, passions: [{ name: 'Coding' }] },
        { passion_id: 2, passions: [{ name: 'Music' }] },
    ];
    const mockUserId = 'user-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders nothing if no passions', () => {
        const { container } = render(<PassionSpotlight userPassions={[]} userId={mockUserId} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('fetches and renders profiles', async () => {
        const mockProfiles = [
            { id: 'p1', first_name: 'Alice' },
            { id: 'p2', first_name: 'Bob' },
        ];
        (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockProfiles, error: null });

        render(<PassionSpotlight userPassions={mockUserPassions} userId={mockUserId} />);

        await waitFor(() => {
            expect(screen.getByText(/Explore:/)).toBeInTheDocument();
        });

        expect(supabase.rpc).toHaveBeenCalledWith('get_profiles_for_passion', expect.objectContaining({
            p_exclude_user_id: mockUserId,
        }));
    });

    it('renders default title if first_name is missing', async () => {
        const mockProfiles = [
            { id: 'p1', first_name: null },
        ];
        (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockProfiles, error: null });

        render(<PassionSpotlight userPassions={mockUserPassions} userId={mockUserId} />);

        await waitFor(() => {
            expect(screen.getByTitle('User')).toBeInTheDocument();
        });
    });

    it('handles fetch error gracefully', async () => {
        (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Error' } });
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<PassionSpotlight userPassions={mockUserPassions} userId={mockUserId} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        
        consoleSpy.mockRestore();
    });
});
