import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from '../src/app/login/page';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authCopy } from '../src/lib/app-copy';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(() => ({ get: jest.fn().mockReturnValue(null) })),
}));

const mockSignIn = jest.fn();
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ signIn: mockSignIn }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

jest.mock('@clerk/nextjs', () => ({
  useSignIn: () => ({ signIn: { authenticateWithRedirect: jest.fn() } }),
}))

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => ({ signIn: { authenticateWithRedirect: jest.fn() } }),
}));

describe('Login Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
    mockSignIn.mockReset();
  });

  it('shows a popup asking the user to verify their email when sign in is rejected', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSignIn.mockRejectedValue(new Error('Please verify your email before signing in.'));
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123#' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'Password123#');
      expect(mockPush).toHaveBeenCalledWith('/verify-email/resend?email=user%40example.com');
    });
    expect(toast.error).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('validates empty fields before attempting to sign in', () => {
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(authCopy.login.emptyFieldsError, { id: 'login-error' });
  });

  it('routes to the dashboard after a successful sign in', async () => {
    mockSignIn.mockResolvedValue(undefined);
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123#' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => { expect(mockPush).toHaveBeenCalledWith('/dashboard'); });
  });

  it('shows error toast on unexpected sign in failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockSignIn.mockRejectedValue(new Error('Unexpected error'));
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Password123#' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => { expect(toast.error).toHaveBeenCalled(); });
    consoleSpy.mockRestore();
  });
});
