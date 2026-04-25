import { randomUUID } from 'crypto';
import {
	buildAppUrl,
	clearAppwriteSessionCookie,
	createAppwriteAdminAccount,
	createAppwriteAdminUsers,
	createAppwriteSessionAccount,
	getAppwriteErrorMessage,
	getAppwriteErrorStatus,
	getAppwriteSessionSecret,
	setAppwriteSessionCookie,
} from '../../src/lib/appwrite/server';

jest.mock('crypto', () => ({
	randomUUID: jest.fn(() => 'generated-user-id'),
}));

jest.mock('../../src/lib/appwrite/server', () => ({
	buildAppUrl: jest.fn((path: string) => `https://skillogue.test${path}`),
	clearAppwriteSessionCookie: jest.fn(),
	createAppwriteAdminAccount: jest.fn(),
	createAppwriteAdminUsers: jest.fn(),
	createAppwriteSessionAccount: jest.fn(),
	getAppwriteErrorMessage: jest.fn((error: unknown, fallback: string) =>
		error instanceof Error ? error.message : fallback
	),
	getAppwriteErrorStatus: jest.fn((error: { code?: number } | undefined, fallback = 500) =>
		typeof error?.code === 'number' ? error.code : fallback
	),
	getAppwriteSessionSecret: jest.fn(),
	setAppwriteSessionCookie: jest.fn(),
}));

jest.mock('next/server', () => ({
	NextRequest: class NextRequest {},
	NextResponse: {
		json: (body: unknown, init?: { status?: number }) => ({
			status: init?.status ?? 200,
			json: async () => body,
			cookies: {
				set: jest.fn(),
			},
		}),
	},
}));

describe('/api/auth/[...all] route', () => {
	const createEmailPasswordSession = jest.fn();
	const createRecovery = jest.fn();
	const updateRecovery = jest.fn();
	const updateEmailVerification = jest.fn();
	const getUser = jest.fn();
	const getSession = jest.fn();
	const deleteSession = jest.fn();
	const createUser = jest.fn();
	const createEmailVerification = jest.fn();
	let routeHandlers: typeof import('../../src/app/api/auth/[...all]/route');

	const createRequest = (body?: unknown) =>
		({
			headers: {
				get: jest.fn((name: string) => (name === 'user-agent' ? 'jest-test' : null)),
			},
			json: jest.fn().mockResolvedValue(body),
		}) as never;

	const routeParams = (route: string) => ({
		params: Promise.resolve({ all: route.split('/') }),
	});

	beforeAll(async () => {
		routeHandlers = await import('../../src/app/api/auth/[...all]/route');
	});

	beforeEach(() => {
		jest.clearAllMocks();

		createEmailPasswordSession.mockResolvedValue({
			secret: 'session-secret',
			expire: '2026-12-31T00:00:00.000Z',
		});
		createRecovery.mockResolvedValue(undefined);
		updateRecovery.mockResolvedValue(undefined);
		updateEmailVerification.mockResolvedValue(undefined);
		getUser.mockResolvedValue({
			$id: 'user-123',
			email: 'user@example.com',
			name: 'User',
		});
		getSession.mockResolvedValue({
			expire: '2026-12-31T00:00:00.000Z',
		});
		deleteSession.mockResolvedValue(undefined);
		createUser.mockResolvedValue({
			$id: 'user-123',
			email: 'user@example.com',
			name: 'user',
		});
		createEmailVerification.mockResolvedValue(undefined);

		(getAppwriteSessionSecret as jest.Mock).mockReturnValue('session-secret');
		(createAppwriteAdminAccount as jest.Mock).mockReturnValue({
			createEmailPasswordSession,
			createRecovery,
			updateRecovery,
			updateEmailVerification,
		});
		(createAppwriteAdminUsers as jest.Mock).mockReturnValue({
			create: createUser,
		});
		(createAppwriteSessionAccount as jest.Mock).mockReturnValue({
			get: getUser,
			getSession,
			createEmailVerification,
			deleteSession,
		});
	});

	it('returns the current session payload from GET /session', async () => {
		const response = await routeHandlers.GET(createRequest(), routeParams('session'));

		expect(getAppwriteSessionSecret).toHaveBeenCalled();
		expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', 'jest-test');
		await expect(response.json()).resolves.toEqual({
			session: {
				user: {
					id: 'user-123',
					email: 'user@example.com',
					name: 'User',
				},
				expires: '2026-12-31T00:00:00.000Z',
			},
		});
	});

	it('returns a signed-out payload from GET /session when there is no cookie', async () => {
		(getAppwriteSessionSecret as jest.Mock).mockReturnValue(undefined);

		const response = await routeHandlers.GET(createRequest(), routeParams('session'));

		expect(createAppwriteSessionAccount).not.toHaveBeenCalled();
		expect(clearAppwriteSessionCookie).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toEqual({ session: null });
	});

	it('clears the cookie when GET /session restoration fails', async () => {
		getUser.mockRejectedValueOnce(new Error('expired'));

		const response = await routeHandlers.GET(createRequest(), routeParams('session'));

		expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
		await expect(response.json()).resolves.toEqual({ session: null });
	});

	it('returns 404 for unknown GET routes', async () => {
		const response = await routeHandlers.GET(createRequest(), routeParams('missing'));

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ message: 'Not found.' });
	});

	it('signs in users and sets the session cookie', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com', password: 'Password123#' }),
			routeParams('sign-in/email')
		);

		expect(createAppwriteAdminAccount).toHaveBeenCalledWith('jest-test');
		expect(createEmailPasswordSession).toHaveBeenCalledWith({
			email: 'user@example.com',
			password: 'Password123#',
		});
		expect(setAppwriteSessionCookie).toHaveBeenCalledWith(
			response,
			'session-secret',
			'2026-12-31T00:00:00.000Z'
		);
		await expect(response.json()).resolves.toEqual({
			session: {
				user: {
					id: 'user-123',
					email: 'user@example.com',
					name: 'User',
				},
				expires: '2026-12-31T00:00:00.000Z',
			},
		});
	});

	it('rejects sign-in requests without credentials', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: ' ', password: '' }),
			routeParams('sign-in/email')
		);

		expect(createAppwriteAdminAccount).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ message: 'Email and password are required.' });
	});

	it('maps Appwrite sign-in failures', async () => {
		const failure = Object.assign(new Error('Invalid credentials'), { code: 401 });
		createEmailPasswordSession.mockRejectedValueOnce(failure);

		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com', password: 'wrong-password' }),
			routeParams('sign-in/email')
		);

		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to sign in.');
		expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 401);
		expect(response.status).toBe(401);
		await expect(response.json()).resolves.toEqual({ message: 'Invalid credentials' });
	});

	it('signs up users and sends the verification email', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com', password: 'Password123#' }),
			routeParams('sign-up/email')
		);

		expect(createAppwriteAdminUsers).toHaveBeenCalledWith('jest-test');
		expect(randomUUID).toHaveBeenCalled();
		expect(createUser).toHaveBeenCalledWith({
			userId: 'generated-user-id',
			email: 'user@example.com',
			password: 'Password123#',
			name: 'user',
		});
		expect(createEmailPasswordSession).toHaveBeenCalledWith({
			email: 'user@example.com',
			password: 'Password123#',
		});
		expect(buildAppUrl).toHaveBeenCalledWith('/verify-email');
		expect(createEmailVerification).toHaveBeenCalledWith({
			url: 'https://skillogue.test/verify-email',
		});
		expect(deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
		await expect(response.json()).resolves.toEqual({
			user: {
				id: 'user-123',
				email: 'user@example.com',
				name: 'user',
			},
			requiresEmailVerification: true,
		});
	});

	it('continues sign-up when verification session cleanup fails', async () => {
		deleteSession.mockRejectedValueOnce(new Error('cleanup failed'));

		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com', password: 'Password123#' }),
			routeParams('sign-up/email')
		);

		expect(createEmailVerification).toHaveBeenCalled();
		await expect(response.json()).resolves.toEqual({
			user: {
				id: 'user-123',
				email: 'user@example.com',
				name: 'user',
			},
			requiresEmailVerification: true,
		});
	});

	it('rejects sign-up requests without credentials', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: '', password: ' ' }),
			routeParams('sign-up/email')
		);

		expect(createUser).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ message: 'Email and password are required.' });
	});

	it('maps sign-up failures', async () => {
		const failure = Object.assign(new Error('Email already exists'), { code: 409 });
		createUser.mockRejectedValueOnce(failure);

		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com', password: 'Password123#' }),
			routeParams('sign-up/email')
		);

		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to sign up.');
		expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 400);
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({ message: 'Email already exists' });
	});

	it('signs out locally when there is no remote session', async () => {
		(getAppwriteSessionSecret as jest.Mock).mockReturnValue(undefined);

		const response = await routeHandlers.POST(createRequest(), routeParams('sign-out'));

		expect(createAppwriteSessionAccount).not.toHaveBeenCalled();
		expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('deletes the remote session during sign-out when a cookie exists', async () => {
		const response = await routeHandlers.POST(createRequest(), routeParams('sign-out'));

		expect(createAppwriteSessionAccount).toHaveBeenCalledWith('session-secret', 'jest-test');
		expect(deleteSession).toHaveBeenCalledWith({ sessionId: 'current' });
		expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('still clears the cookie when remote sign-out fails', async () => {
		deleteSession.mockRejectedValueOnce(new Error('already gone'));

		const response = await routeHandlers.POST(createRequest(), routeParams('sign-out'));

		expect(clearAppwriteSessionCookie).toHaveBeenCalledWith(response);
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('starts password recovery requests', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com' }),
			routeParams('reset-password')
		);

		expect(buildAppUrl).toHaveBeenCalledWith('/reset-password');
		expect(createRecovery).toHaveBeenCalledWith({
			email: 'user@example.com',
			url: 'https://skillogue.test/reset-password',
		});
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('rejects password recovery requests without an email', async () => {
		const response = await routeHandlers.POST(
			createRequest({ email: ' ' }),
			routeParams('reset-password')
		);

		expect(createRecovery).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ message: 'Email is required.' });
	});

	it('maps password recovery request failures', async () => {
		const failure = Object.assign(new Error('Recovery failed'), { code: 422 });
		createRecovery.mockRejectedValueOnce(failure);

		const response = await routeHandlers.POST(
			createRequest({ email: 'user@example.com' }),
			routeParams('reset-password')
		);

		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(
			failure,
			'Failed to send password reset email.'
		);
		expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 400);
		expect(response.status).toBe(422);
		await expect(response.json()).resolves.toEqual({ message: 'Recovery failed' });
	});

	it('returns 404 for unknown POST routes', async () => {
		const response = await routeHandlers.POST(createRequest(), routeParams('missing'));

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ message: 'Not found.' });
	});

	it('completes password recovery', async () => {
		const response = await routeHandlers.PUT(
			createRequest({
				userId: 'user-123',
				secret: 'recovery-secret',
				password: 'Password123#',
			}),
			routeParams('reset-password')
		);

		expect(updateRecovery).toHaveBeenCalledWith({
			userId: 'user-123',
			secret: 'recovery-secret',
			password: 'Password123#',
		});
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('rejects recovery completion without all required fields', async () => {
		const response = await routeHandlers.PUT(
			createRequest({ userId: 'user-123', secret: '', password: 'Password123#' }),
			routeParams('reset-password')
		);

		expect(updateRecovery).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			message: 'User ID, secret, and password are required.',
		});
	});

	it('maps recovery completion failures', async () => {
		const failure = Object.assign(new Error('Reset failed'), { code: 400 });
		updateRecovery.mockRejectedValueOnce(failure);

		const response = await routeHandlers.PUT(
			createRequest({
				userId: 'user-123',
				secret: 'recovery-secret',
				password: 'Password123#',
			}),
			routeParams('reset-password')
		);

		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to update password.');
		expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 400);
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({ message: 'Reset failed' });
	});

	it('verifies email addresses', async () => {
		const response = await routeHandlers.PUT(
			createRequest({ userId: 'user-123', secret: 'verification-secret' }),
			routeParams('verify-email')
		);

		expect(updateEmailVerification).toHaveBeenCalledWith({
			userId: 'user-123',
			secret: 'verification-secret',
		});
		await expect(response.json()).resolves.toEqual({ success: true });
	});

	it('rejects verify-email requests without all required fields', async () => {
		const response = await routeHandlers.PUT(
			createRequest({ userId: 'user-123', secret: '' }),
			routeParams('verify-email')
		);

		expect(updateEmailVerification).not.toHaveBeenCalled();
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			message: 'User ID and secret are required.',
		});
	});

	it('maps verify-email failures', async () => {
		const failure = Object.assign(new Error('Verification failed'), { code: 409 });
		updateEmailVerification.mockRejectedValueOnce(failure);

		const response = await routeHandlers.PUT(
			createRequest({ userId: 'user-123', secret: 'verification-secret' }),
			routeParams('verify-email')
		);

		expect(getAppwriteErrorMessage).toHaveBeenCalledWith(failure, 'Failed to verify email.');
		expect(getAppwriteErrorStatus).toHaveBeenCalledWith(failure, 400);
		expect(response.status).toBe(409);
		await expect(response.json()).resolves.toEqual({ message: 'Verification failed' });
	});

	it('returns 404 for unknown PUT routes', async () => {
		const response = await routeHandlers.PUT(createRequest(), routeParams('missing'));

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({ message: 'Not found.' });
	});
});
