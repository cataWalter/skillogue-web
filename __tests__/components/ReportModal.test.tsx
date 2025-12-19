import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../../src/components/ReportModal';
import { supabase } from '../../src/supabaseClient';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../src/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => ({
            insert: jest.fn(),
        })),
    },
}));

jest.mock('react-hot-toast', () => ({
    success: jest.fn(),
    error: jest.fn(),
}));

describe('ReportModal Component', () => {
    const mockOnClose = jest.fn();
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        reporterId: 'reporter-123',
        reportedUserId: 'reported-456',
        reportedUserName: 'Bad User',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly when open', () => {
        render(<ReportModal {...defaultProps} />);
        expect(screen.getByText('Report Bad User')).toBeInTheDocument();
        expect(screen.getByText(/Please describe why you are reporting this user/)).toBeInTheDocument();
    });

    it('does not submit if reason is empty', async () => {
        render(<ReportModal {...defaultProps} />);
        const submitButton = screen.getByText('Submit Report');
        fireEvent.click(submitButton);
        
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('submits report successfully', async () => {
        const mockInsert = jest.fn().mockResolvedValue({ error: null });
        (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

        render(<ReportModal {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Reason for reporting...');
        fireEvent.change(textarea, { target: { value: 'Spam content' } });
        
        const submitButton = screen.getByText('Submit Report');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(mockInsert).toHaveBeenCalledWith({
                reporter_id: 'reporter-123',
                reported_user_id: 'reported-456',
                reason: 'Spam content',
            });
            expect(toast.success).toHaveBeenCalled();
            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    it('does not submit if reason is empty', async () => {
        render(<ReportModal {...defaultProps} />);
        
        const submitButton = screen.getByText('Submit Report');
        fireEvent.click(submitButton);

        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('handles submission error', async () => {
        const mockError = new Error('DB Error');
        const mockInsert = jest.fn().mockResolvedValue({ error: mockError });
        (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<ReportModal {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Reason for reporting...');
        fireEvent.change(textarea, { target: { value: 'Spam content' } });
        
        const submitButton = screen.getByText('Submit Report');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('DB Error');
            expect(mockOnClose).not.toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });

    it('handles submission error with non-Error object', async () => {
        const mockInsert = jest.fn().mockRejectedValue('Unknown Error');
        (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(<ReportModal {...defaultProps} />);
        
        const textarea = screen.getByPlaceholderText('Reason for reporting...');
        fireEvent.change(textarea, { target: { value: 'Spam content' } });
        
        const submitButton = screen.getByText('Submit Report');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to submit report');
        });

        consoleSpy.mockRestore();
    });
});
