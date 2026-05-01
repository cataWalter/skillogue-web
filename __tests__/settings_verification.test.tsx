import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VerificationPage from '../src/app/settings/verification/page';
import { appClient } from '../src/lib/appClient';
import { settingsCopy } from '../src/lib/app-copy';
import { toast } from 'react-hot-toast';
import { trackAnalyticsEvent } from '../src/lib/analytics';

const mockInsert = jest.fn();
let mockVerificationRequest: { status: 'pending' | 'approved' | 'rejected' } | null = null;
let mockVerifiedProfile = false;

jest.mock('../src/lib/appClient', () => ({
  appClient: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

jest.mock('../src/lib/analytics', () => ({
  trackAnalyticsEvent: jest.fn().mockResolvedValue(undefined),
}));

describe('VerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerificationRequest = null;
    mockVerifiedProfile = false;
    mockInsert.mockResolvedValue({ error: null });
    (appClient.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'user-1' } } });
    (appClient.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: { verified: mockVerifiedProfile }, error: null }),
            })),
          })),
        };
      }

      if (table === 'verification_requests') {
        return {
          insert: mockInsert,
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: mockVerificationRequest, error: null }),
                })),
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  });

  it('renders the request state when no verification has been submitted yet', async () => {
    render(<VerificationPage />);

    await waitFor(() => {
      expect(screen.getByText('Request a verified badge')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Request Verification' })).toBeInTheDocument();
      expect(screen.getByText('Why members request verification')).toBeInTheDocument();
    });
  });

  it('renders the approved state when the profile is already verified', async () => {
    mockVerifiedProfile = true;

    render(<VerificationPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: settingsCopy.verification.approvedTitle })).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.verification.approvedDescription)).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.verification.approvedHelper)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: settingsCopy.verification.requestButton })).not.toBeInTheDocument();
    });
  });

  it('renders the pending state when the latest request is pending', async () => {
    mockVerificationRequest = { status: 'pending' };

    render(<VerificationPage />);

    await waitFor(() => {
      expect(screen.getByText(settingsCopy.verification.pendingTitle)).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.verification.pendingDescription)).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.verification.pendingHelper)).toBeInTheDocument();
    });
  });

  it('renders the rejected state and allows a retry', async () => {
    mockVerificationRequest = { status: 'rejected' };

    render(<VerificationPage />);

    const retryButton = await screen.findByRole('button', { name: 'Try Again' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-1' });
      expect(toast.success).toHaveBeenCalledWith('Verification request submitted!');
      expect(trackAnalyticsEvent).toHaveBeenCalledWith('verification_requested');
    });
  });

  it('logs and falls back to the request state when loading verification status fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    (appClient.auth.getUser as jest.Mock).mockRejectedValueOnce(new Error('status failed'));

    render(<VerificationPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching verification status:',
        expect.any(Error)
      );
      expect(screen.getByText(settingsCopy.verification.noneTitle)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: settingsCopy.verification.requestButton })).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('stops loading and stays in the request state when no authenticated user is available during status fetch', async () => {
    (appClient.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });

    render(<VerificationPage />);

    await waitFor(() => {
      expect(screen.getByText(settingsCopy.verification.noneTitle)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: settingsCopy.verification.requestButton })).toBeInTheDocument();
    });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('shows the authentication error when a verification request is submitted without a user', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    let getUserCalls = 0;
    (appClient.auth.getUser as jest.Mock).mockImplementation(async () => {
      getUserCalls += 1;

      if (getUserCalls === 1) {
        return { data: { user: { id: 'user-1' } } };
      }

      return { data: { user: null } };
    });

    render(<VerificationPage />);

    const requestButton = await screen.findByRole('button', { name: settingsCopy.verification.requestButton });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error requesting verification:',
        expect.any(Error)
      );
      expect(toast.error).toHaveBeenCalledWith(settingsCopy.verification.notAuthenticated);
      expect(mockInsert).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  it('uses the fallback submission error message when insert fails with a non-Error payload', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    mockInsert.mockResolvedValueOnce({ error: { message: 'plain failure' } });

    render(<VerificationPage />);

    const requestButton = await screen.findByRole('button', { name: settingsCopy.verification.requestButton });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error requesting verification:', { message: 'plain failure' });
      expect(toast.error).toHaveBeenCalledWith(settingsCopy.verification.submitError);
      expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
