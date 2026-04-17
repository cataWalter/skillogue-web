import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminVerification from '../../../src/app/admin/verification/page';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Import the mocked toast after jest.mock
import { toast } from 'react-hot-toast';

describe('AdminVerification', () => {
  const mockRequests = [
    { 
      id: 1, 
      user_id: 'user-1', 
      status: 'pending', 
      created_at: '2024-01-01T00:00:00Z',
      profiles: { first_name: 'John', last_name: 'Doe', id: 'user-1' }
    },
    { 
      id: 2, 
      user_id: 'user-2', 
      status: 'pending', 
      created_at: '2024-01-02T00:00:00Z',
      profiles: { first_name: 'Jane', last_name: 'Smith', id: 'user-2' }
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('shows loading state initially', () => {
    mockFetch.mockResolvedValue({ ok: false });
    render(<AdminVerification />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render verification requests after loading', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequests),
    });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should show empty state when no requests', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });
  });

  it('should approve verification request', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      })
      .mockResolvedValueOnce({ ok: true });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getAllByTitle('Approve')[0];
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/verification/1',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(toast.success).toHaveBeenCalledWith('User verified successfully');
    });
  });

  it('should handle approve error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      })
      .mockResolvedValueOnce({ ok: false });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButton = screen.getAllByTitle('Approve')[0];
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to approve');
    });
  });

  it('should reject verification request', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      })
      .mockResolvedValueOnce({ ok: true });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByTitle('Reject')[0];
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/admin/verification/1',
        expect.objectContaining({ method: 'PATCH' })
      );
      expect(toast.success).toHaveBeenCalledWith('Request rejected');
    });
  });

  it('should handle reject error', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRequests),
      })
      .mockResolvedValueOnce({ ok: false });

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButton = screen.getAllByTitle('Reject')[0];
    fireEvent.click(rejectButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to reject');
    });
  });

  it('should display formatted dates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRequests),
    });

    render(<AdminVerification />);

    await waitFor(() => {
      // Dates should be formatted as locale date strings
      expect(screen.getByText('1/1/2024')).toBeInTheDocument();
      expect(screen.getByText('1/2/2024')).toBeInTheDocument();
    });
  });
});