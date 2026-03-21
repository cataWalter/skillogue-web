import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminVerification from '../../../src/app/admin/verification/page';
import { toast } from 'react-hot-toast';

// Mock supabase - define mock inline in jest.mock
jest.mock('../../../src/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })),
  },
}));

// Get the mock after it's set up
const mockSupabase = require('../../../src/supabaseClient').supabase;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AdminVerification', () => {
  const mockRequests = [
    {
      id: 1,
      user_id: 'user-123',
      status: 'pending',
      created_at: '2023-01-01T00:00:00Z',
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
        id: 'user-123',
      },
    },
    {
      id: 2,
      user_id: 'user-456',
      status: 'pending',
      created_at: '2023-01-02T00:00:00Z',
      profiles: {
        first_name: 'Jane',
        last_name: 'Smith',
        id: 'user-456',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<AdminVerification />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render verification requests after loading', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('Verification Requests')).toBeInTheDocument();
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('user-123')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('user-456')).toBeInTheDocument();
  });

  it('should render empty state when no requests', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('No pending requests')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Fetch failed' },
          }),
        }),
      }),
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching requests:', expect.any(Object));
    });

    consoleSpy.mockRestore();
  });

  it('should approve verification request', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
      update: mockUpdate,
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'approved' });
      expect(toast.success).toHaveBeenCalledWith('User verified successfully');
    });
  });

  it('should handle approve error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFrom = mockSupabase.from as jest.Mock;
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: { message: 'Update failed' } });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
      update: mockUpdate,
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByTitle('Approve');
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error approving:', expect.any(Object));
      expect(toast.error).toHaveBeenCalledWith('Failed to approve');
    });

    consoleSpy.mockRestore();
  });

  it('should reject verification request', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
      update: mockUpdate,
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'rejected' });
      expect(toast.success).toHaveBeenCalledWith('Request rejected');
    });
  });

  it('should handle reject error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFrom = mockSupabase.from as jest.Mock;
    const mockUpdateEq = jest.fn().mockResolvedValue({ error: { message: 'Update failed' } });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });
    
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
      update: mockUpdate,
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByTitle('Reject');
    fireEvent.click(rejectButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error rejecting:', expect.any(Object));
      expect(toast.error).toHaveBeenCalledWith('Failed to reject');
    });

    consoleSpy.mockRestore();
  });

  it('should display formatted dates', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('1/1/2023')).toBeInTheDocument();
      expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    });
  });

  it('should have proper table structure', async () => {
    const mockFrom = mockSupabase.from as jest.Mock;
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockRequests,
            error: null,
          }),
        }),
      }),
    }));

    render(<AdminVerification />);

    await waitFor(() => {
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
