import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from '../src/app/login/page';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authCopy } from '../src/lib/app-copy';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockSignIn = jest.fn();
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
  }),
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

describe('Login Page', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    jest.clearAllMocks();
    mockSignIn.mockReset();
  });

  it('shows a popup asking the user to verify their email when sign in is rejected', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const verificationMessage =
      'Please verify your email before signing in. Check your inbox and wait to verify the email.';

    mockSignIn.mockRejectedValue(new Error(verificationMessage));

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
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
    expect(toast.error).toHaveBeenCalledWith(authCopy.login.emptyFieldsError, {
      id: 'login-error',
    });
  });

  it('routes to the dashboard after a successful sign in', async () => {
    mockSignIn.mockResolvedValue(undefined);

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'Password123#');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows the returned error when sign in fails for a non-verification reason', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials', {
        id: 'login-error',
        duration: 4000,
      });
    });

    consoleSpy.mockRestore();
  });

  it('falls back to the unexpected error copy when the rejection is not an Error instance', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    mockSignIn.mockRejectedValue('unstructured error');

    render(<Login />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(authCopy.login.unexpectedError, {
        id: 'login-error',
        duration: 4000,
      });
    });

    consoleSpy.mockRestore();
  });
});
