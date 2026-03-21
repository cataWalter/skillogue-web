import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Avatar from '../../src/components/Avatar';
import { createAvatar } from '@dicebear/core';

// Mock createAvatar
jest.mock('@dicebear/core', () => ({
    createAvatar: jest.fn(),
}));

// Mock collections to avoid ESM issues
jest.mock('@dicebear/collection', () => ({
    adventurer: {},
    bottts: {},
    micah: {},
    miniavs: {},
    openPeeps: {},
    personas: {},
    pixelArt: {},
    thumbs: {},
}));

describe('Avatar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation to avoid errors in tests that don't specify it
        (createAvatar as jest.Mock).mockResolvedValue({
            toDataUri: jest.fn().mockResolvedValue('data:image/svg+xml;base64,default'),
        });
    });

    it('renders loading state initially', async () => {
        // Mock a pending promise so state doesn't update during test
        (createAvatar as jest.Mock).mockReturnValue(new Promise(() => {}));
        
        render(<Avatar seed="test-seed" />);
        const loader = screen.getByLabelText('Loading avatar');
        expect(loader).toBeInTheDocument();
        expect(loader).toHaveClass('animate-pulse');
    });

    it('renders avatar image after generation', async () => {
        const mockToDataUri = jest.fn().mockResolvedValue('data:image/svg+xml;base64,test');
        (createAvatar as jest.Mock).mockResolvedValue({
            toDataUri: mockToDataUri,
        });

        render(<Avatar seed="test-seed" alt="Test Avatar" />);

        await waitFor(() => {
            const image = screen.getByAltText('Test Avatar');
            expect(image).toBeInTheDocument();
            expect(image).toHaveAttribute('src', 'data:image/svg+xml;base64,test');
        });
    });

    it('handles generation error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (createAvatar as jest.Mock).mockRejectedValue(new Error('Generation failed'));

        render(<Avatar seed="error-seed" />);

        // Should stay in loading state or handle error (currently stays in loading)
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to generate avatar:', expect.any(Error));
        });
        
        expect(screen.getByLabelText('Loading avatar')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});
