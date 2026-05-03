import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VerifyEmailPage from '../src/app/verify-email/page';
import { authCopy } from '../src/lib/app-copy';

const mockAttemptEmailAddressVerification = jest.fn();
const mockPrepareEmailAddressVerification = jest.fn();
const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignUp: () => ({
    signUp: {
      attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
      prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
    },
    isLoaded: true,
  }),
}));

describe('Verify Email Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAttemptEmailAddressVerification.mockResolvedValue({ status: 'complete' });
    mockPrepareEmailAddressVerification.mockResolvedValue({});
  });

  it('renders the verification code input form', () => {
    render(<VerifyEmailPage />);
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /verify email/i })).toBeInTheDocument();
  });

  it('verifies the email when the user submits a valid code', async () => {
    render(<VerifyEmailPage />);

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '123456' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /verify email/i }).closest('form')!);

    await waitFor(() => {
      expect(mockAttemptEmailAddressVerification).toHaveBeenCalledWith({ code: '123456' });
    });

    expect(
      await screen.findByText(authCopy.verifyEmail.successMessage)
    ).toBeInTheDocument();
  });

  it('shows an error message when verification fails', async () => {
    mockAttemptEmailAddressVerification.mockRejectedValueOnce(new Error('Code expired'));

    render(<VerifyEmailPage />);

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '000000' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /verify email/i }).closest('form')!);

    expect(await screen.findByText('Code expired')).toBeInTheDocument();
  });

  it('falls back to the generic failure copy when verification fails with a non-Error value', async () => {
    mockAttemptEmailAddressVerification.mockRejectedValueOnce('unexpected failure');

    render(<VerifyEmailPage />);

    fireEvent.change(screen.getByLabelText(/verification code/i), {
      target: { value: '000000' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /verify email/i }).closest('form')!);

    expect(await screen.findByText(authCopy.verifyEmail.failure)).toBeInTheDocument();
  });
});
