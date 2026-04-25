import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ResendVerificationPage from '../src/app/verify-email/resend/page';

const mockFetch = jest.fn();

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('email=user@example.com'),
}));

describe('Resend Verification Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as typeof fetch;
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
});