import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BlockedUsersPage from '../src/app/settings/blocked/page';
import { appClient } from '../src/lib/appClient';
import { settingsCopy } from '../src/lib/app-copy';
import toast from 'react-hot-toast';

jest.mock('../src/lib/appClient', () => ({
  appClient: {
    rpc: jest.fn(),
  },
}));

jest.mock('../src/components/Avatar', () => ({
  __esModule: true,
  default: ({ seed, className }: { seed: string; className?: string }) => (
    <div data-testid="avatar" data-seed={seed} className={className} />
  ),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('BlockedUsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.confirm = jest.fn(() => true);
  });

  it('loads blocked users through the blocked-users RPC', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          blocked_id: 'user-1',
          profile: {
            id: 'user-1',
            first_name: 'Cata',
            last_name: 'Walter',
            avatar_url: null,
          },
        },
      ],
      error: null,
    });

    render(<BlockedUsersPage />);

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('list_blocked_users');
      expect(screen.getByText('Cata Walter')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Unblock' })).toBeInTheDocument();
  });

  it('unblocks a user through the unblock RPC and removes the row', async () => {
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({
        data: [
          {
            blocked_id: 'user-1',
            profile: {
              id: 'user-1',
              first_name: 'Cata',
              last_name: 'Walter',
              avatar_url: null,
            },
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: true, error: null });

    render(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Cata Walter')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Unblock' }));

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(appClient.rpc).toHaveBeenCalledWith('unblock_user', { target_id: 'user-1' });
      expect(screen.queryByText('Cata Walter')).not.toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith('Cata Walter has been unblocked');
  });

  it('falls back to the blocked id when profile hydration is missing', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          blocked_id: 'cata.walter@gmail.com',
          profile: null,
        },
      ],
      error: null,
    });

    render(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('cata.walter@gmail.com')).toBeInTheDocument();
    });
  });

  it('shows the empty state when the blocked-users RPC returns a non-array payload', async () => {
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: null,
    });

    render(<BlockedUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(settingsCopy.blocked.emptyTitle)).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.blocked.emptyDescription)).toBeInTheDocument();
      expect(screen.getByText(settingsCopy.blocked.emptyHelper)).toBeInTheDocument();
    });
  });

  it('logs and toasts when loading blocked users fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: new Error('load failed'),
    });

    render(<BlockedUsersPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching blocked users:', expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith(settingsCopy.blocked.loadError);
      expect(screen.getByText(settingsCopy.blocked.emptyTitle)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('does not call the unblock RPC when the confirmation is cancelled', async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    (appClient.rpc as jest.Mock).mockResolvedValueOnce({
      data: [
        {
          blocked_id: 'user-1',
          profile: {
            id: 'user-1',
            first_name: 'Cata',
            last_name: 'Walter',
            avatar_url: null,
          },
        },
      ],
      error: null,
    });

    render(<BlockedUsersPage />);

    const unblockButton = await screen.findByRole('button', { name: 'Unblock' });
    fireEvent.click(unblockButton);

    expect(window.confirm).toHaveBeenCalledWith(settingsCopy.blocked.unblockConfirm('Cata Walter'));
    expect(appClient.rpc).toHaveBeenCalledTimes(1);
    expect(appClient.rpc).not.toHaveBeenCalledWith('unblock_user', { target_id: 'user-1' });
    expect(screen.getByText('Cata Walter')).toBeInTheDocument();
  });

  it('surfaces the unblock error message when the RPC fails with an Error', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({
        data: [
          {
            blocked_id: 'user-1',
            profile: {
              id: 'user-1',
              first_name: 'Cata',
              last_name: 'Walter',
              avatar_url: null,
            },
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: new Error('rpc unblock failed') });

    render(<BlockedUsersPage />);

    const unblockButton = await screen.findByRole('button', { name: 'Unblock' });
    fireEvent.click(unblockButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error unblocking user:', expect.any(Error));
      expect(toast.error).toHaveBeenCalledWith('rpc unblock failed');
      expect(screen.getByText('Cata Walter')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('uses the fallback unblock error when the RPC rejects with a non-Error payload', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (appClient.rpc as jest.Mock)
      .mockResolvedValueOnce({
        data: [
          {
            blocked_id: 'user-1',
            profile: {
              id: 'user-1',
              first_name: 'Cata',
              last_name: 'Walter',
              avatar_url: null,
            },
          },
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: 'plain failure' } });

    render(<BlockedUsersPage />);

    const unblockButton = await screen.findByRole('button', { name: 'Unblock' });
    fireEvent.click(unblockButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error unblocking user:', { message: 'plain failure' });
      expect(toast.error).toHaveBeenCalledWith(settingsCopy.blocked.unblockFallbackError);
      expect(screen.getByText('Cata Walter')).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});