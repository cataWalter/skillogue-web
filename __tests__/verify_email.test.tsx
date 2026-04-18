import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import VerifyEmailPage from '../src/app/verify-email/page';
import { authCopy } from '../src/lib/app-copy';

const mockUpdateEmailVerification = jest.fn();
let searchParamsValue = 'userId=user-123&secret=verification-secret';

jest.mock('next/navigation', () => ({
	useSearchParams: () => new URLSearchParams(searchParamsValue),
}));

jest.mock('../src/lib/appwrite/browser', () => ({
	createAppwriteBrowserAccount: () => ({
		updateEmailVerification: mockUpdateEmailVerification,
	}),
}));

describe('Verify Email Page', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		searchParamsValue = 'userId=user-123&secret=verification-secret';
		mockUpdateEmailVerification.mockResolvedValue({});
	});

	it('verifies the email through the Appwrite browser account client', async () => {
		render(<VerifyEmailPage />);

		await waitFor(() => {
			expect(mockUpdateEmailVerification).toHaveBeenCalledWith({
				userId: 'user-123',
				secret: 'verification-secret',
			});
		});

		expect(
			await screen.findByText('Your email has been verified. You can sign in now.')
		).toBeInTheDocument();
	});

	it('shows an error when the verification link is incomplete', async () => {
		searchParamsValue = 'userId=user-123';

		render(<VerifyEmailPage />);

		expect(
			await screen.findByText('Invalid or expired verification link.')
		).toBeInTheDocument();
		expect(mockUpdateEmailVerification).not.toHaveBeenCalled();
	});

	it('shows the thrown error message when email verification fails with an Error', async () => {
		mockUpdateEmailVerification.mockRejectedValueOnce(new Error('Verification already used'));

		render(<VerifyEmailPage />);

		expect(
			await screen.findByText('Verification already used')
		).toBeInTheDocument();
	});

	it('falls back to the generic failure copy when verification fails with a non-Error value', async () => {
		mockUpdateEmailVerification.mockRejectedValueOnce('unexpected failure');

		render(<VerifyEmailPage />);

		expect(
			await screen.findByText(authCopy.verifyEmail.failure)
		).toBeInTheDocument();
	});
});