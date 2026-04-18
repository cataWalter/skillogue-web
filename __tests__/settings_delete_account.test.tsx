import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteAccount from '../src/app/settings/delete-account/page';
import { settingsCopy } from '../src/lib/app-copy';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('DeleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('shows the DELETE confirmation error before calling the API', async () => {
    render(<DeleteAccount />);

    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));

    await waitFor(() => {
      expect(screen.getByText('To confirm, you must type "DELETE" in the box.')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('submits the delete request and redirects after a successful response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn(),
    });

    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText('To confirm, please type "DELETE" below:'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/account', { method: 'DELETE' });
      expect(mockPush).toHaveBeenCalledWith('/?deleted=true');
    });
  });

  it('shows the backend deletion error when the API responds unsuccessfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: 'Backend delete failed' }),
    });

    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText('To confirm, please type "DELETE" below:'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));

    await waitFor(() => {
      expect(screen.getByText(`${settingsCopy.deleteAccount.deleteFailed}: Backend delete failed`)).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('falls back to the generic deletion error when the backend error payload cannot be parsed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockRejectedValue(new Error('invalid json')),
    });

    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText('To confirm, please type "DELETE" below:'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          `${settingsCopy.deleteAccount.deleteFailed}: ${settingsCopy.deleteAccount.deleteFailed}`
        )
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('falls back to the unexpected error copy when deletion rejects with a non-Error value', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as jest.Mock).mockRejectedValue('unexpected failure');

    render(<DeleteAccount />);

    fireEvent.change(screen.getByLabelText('To confirm, please type "DELETE" below:'), {
      target: { value: 'DELETE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Permanently Delete Account' }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Account deletion error:', 'unexpected failure');
      expect(
        screen.getByText(
          `${settingsCopy.deleteAccount.deleteFailed}: ${settingsCopy.deleteAccount.unexpectedError}`
        )
      ).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});