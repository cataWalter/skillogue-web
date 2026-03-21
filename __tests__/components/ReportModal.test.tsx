import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../../src/components/ReportModal';

// Mock useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ReportModal Component', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    reportedUserId: 'reported-456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'reporter-123' } });
    mockFetch.mockReset();
  });

  it('renders correctly when open', () => {
    render(<ReportModal {...defaultProps} />);
    expect(screen.getByText('Report User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Please describe why you want to report this user...')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ReportModal {...{ ...defaultProps, isOpen: false }} />);
    expect(screen.queryByText('Report User')).not.toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<ReportModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not submit if reason is empty', async () => {
    render(<ReportModal {...defaultProps} />);
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);
    
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('submits report successfully', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    render(<ReportModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Please describe why you want to report this user...');
    fireEvent.change(textarea, { target: { value: 'Spam content' } });
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: 'reporter-123',
          reportedId: 'reported-456',
          reason: 'Spam content',
        }),
      });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles submission error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<ReportModal {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Please describe why you want to report this user...');
    fireEvent.change(textarea, { target: { value: 'Spam content' } });
    
    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to submit report');
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
    alertSpy.mockRestore();
  });
});