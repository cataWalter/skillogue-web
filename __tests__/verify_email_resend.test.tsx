import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResendVerificationPage from '../src/app/verify-email/resend/page';
import { authCopy } from '../src/lib/app-copy';

const mockFetch = jest.fn();
let mockSearchParams = new URLSearchParams('email=user@example.com');

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

describe('Resend Verification Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof fetch;
    mockSearchParams = new URLSearchParams('email=user@example.com');
  });

  it('resends the verification email after the user confirms their password', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'We sent you a new verification email. Please check your inbox.',
      }),
    });

    render(<ResendVerificationPage />);

    expect(screen.getByLabelText(/email/i)).toHaveValue('user@example.com');

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/resend-verification',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'Password123#',
          }),
        })
      );
    });

    expect(
      await screen.findByText('We sent you a new verification email. Please check your inbox.')
    ).toBeInTheDocument();
  });

  it('falls back to the default success message when the resend response omits one', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(<ResendVerificationPage />);

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    expect(await screen.findByText(authCopy.resendVerification.success)).toBeInTheDocument();
  });

  it('starts with an empty email field when the query string does not provide one', () => {
    mockSearchParams = new URLSearchParams('');

    render(<ResendVerificationPage />);

    expect(screen.getByLabelText(/email/i)).toHaveValue('');
  });

  it('updates the email field when the user types a new address', () => {
    mockSearchParams = new URLSearchParams('');

    render(<ResendVerificationPage />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'updated@example.com' },
    });

    expect(screen.getByLabelText(/email/i)).toHaveValue('updated@example.com');
  });

  it('requires both email and password before submitting', async () => {
    render(<ResendVerificationPage />);

    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    expect(mockFetch).not.toHaveBeenCalled();
    expect(await screen.findByText(authCopy.resendVerification.emailPasswordRequired)).toBeInTheDocument();
  });

  it('shows the API error message when the resend request fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        message: 'Verification email could not be sent.',
      }),
    });

    render(<ResendVerificationPage />);

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    expect(await screen.findByText('Verification email could not be sent.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send another verification email/i })).toBeInTheDocument();
  });

  it('falls back to the default failure message when the request rejects with a non-Error', async () => {
    mockFetch.mockRejectedValue('network down');

    render(<ResendVerificationPage />);

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    expect(await screen.findByText(authCopy.resendVerification.failure)).toBeInTheDocument();
  });

  it('falls back to the default failure message when the error payload cannot be parsed', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => {
        throw new Error('invalid json');
      },
    });

    render(<ResendVerificationPage />);

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123#' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send another verification email/i }));

    expect(await screen.findByText(authCopy.resendVerification.failure)).toBeInTheDocument();
  });
});
