import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from '../src/app/login/page';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
});