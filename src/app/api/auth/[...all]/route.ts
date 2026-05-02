import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
	buildAppUrl,
	clearAppwriteSessionCookie,
	createAppwriteAdminAccount,
	createAppwriteAdminDatabases,
	createAppwriteAdminUsers,
	createAppwriteSessionAccount,
	getAppwriteErrorMessage,
	getAppwriteErrorStatus,
	getAppwriteSessionSecret,
	setAppwriteSessionCookie,
} from '@/lib/appwrite/server';
import { getAppwriteCollectionId, getAppwriteDatabaseId } from '@/lib/appwrite/config';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Rate limit: 10 attempts per minute per IP per path. */
const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

const jsonError = (message: string, status = 400) =>
	NextResponse.json({ message }, { status });

const getRoutePath = async (
	params: Promise<{ all: string[] }>
): Promise<string> => {
	const { all } = await params;

	return all.join('/');
};

const getUserAgent = (request: NextRequest) =>
	request.headers.get('user-agent') ?? undefined;

const getRequiredString = (value: unknown) =>
	typeof value === 'string' ? value.trim() : '';

const buildSessionPayload = (user: { $id: string; email: string; name?: string | null }, expires: string) => ({
	session: {
		user: {
			id: user.$id,
			email: user.email,
			name: user.name ?? undefined,
		},
		expires,
	},
});

const handleAppwriteSession = async (request: NextRequest) => {
	const sessionSecret = getAppwriteSessionSecret(request);

	if (!sessionSecret) {
		return NextResponse.json({ session: null });
	}

	try {
		const account = createAppwriteSessionAccount(sessionSecret, getUserAgent(request));
		const [user, currentSession] = await Promise.all([
			account.get(),
			account.getSession({ sessionId: 'current' }),
		]);

		return NextResponse.json(buildSessionPayload(user, currentSession.expire));
	} catch {
		const response = NextResponse.json({ session: null });
		clearAppwriteSessionCookie(response);

		return response;
	}
};

const handleAppwriteSignIn = async (request: NextRequest) => {
	const body = await request.json();
	const email = getRequiredString(body.email);
	const password = getRequiredString(body.password);

	if (!email || !password) {
		return jsonError('Email and password are required.', 400);
	}

	try {
		const account = createAppwriteAdminAccount(getUserAgent(request));
		const session = await account.createEmailPasswordSession({ email, password });
		const sessionAccount = createAppwriteSessionAccount(session.secret, getUserAgent(request));
		const user = await sessionAccount.get();
		const response = NextResponse.json(buildSessionPayload(user, session.expire));

		setAppwriteSessionCookie(response, session.secret, session.expire);

		// Update last_login timestamp in the profile document (best-effort, non-blocking)
		try {
			const databases = createAppwriteAdminDatabases(getUserAgent(request));
			await databases.updateDocument(
				getAppwriteDatabaseId(),
				getAppwriteCollectionId('profiles'),
				user.$id,
				{ last_login: new Date().toISOString() }
			);
		} catch {
			// Non-critical: do not fail sign-in if profile update fails
		}

		return response;
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to sign in.'),
			getAppwriteErrorStatus(error, 401)
		);
	}
};

const handleAppwriteSignUp = async (request: NextRequest) => {
	const body = await request.json();
	const email = getRequiredString(body.email);
	const password = getRequiredString(body.password);

	if (!email || !password) {
		return jsonError('Email and password are required.', 400);
	}

	try {
		const userAgent = getUserAgent(request);
		const users = createAppwriteAdminUsers(userAgent);
		const account = createAppwriteAdminAccount(userAgent);

		const user = await users.create({
			userId: randomUUID(),
			email,
			password,
			name: email.split('@')[0],
		});

		const verificationSession = await account.createEmailPasswordSession({
			email,
			password,
		});

		const verificationAccount = createAppwriteSessionAccount(
			verificationSession.secret,
			userAgent
		);

		await verificationAccount.createEmailVerification({
			url: buildAppUrl('/verify-email'),
		});

		try {
			await verificationAccount.deleteSession({ sessionId: 'current' });
		} catch {
			// The verification email has already been sent. A failed cleanup should not block signup.
		}

		return NextResponse.json({
			user: {
				id: user.$id,
				email: user.email,
				name: user.name ?? undefined,
			},
			requiresEmailVerification: true,
		});
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to sign up.'),
			getAppwriteErrorStatus(error, 400)
		);
	}
};

const handleAppwriteSignOut = async (request: NextRequest) => {
	const response = NextResponse.json({ success: true });
	const sessionSecret = getAppwriteSessionSecret(request);

	if (!sessionSecret) {
		clearAppwriteSessionCookie(response);

		return response;
	}

	try {
		const account = createAppwriteSessionAccount(sessionSecret, getUserAgent(request));
		await account.deleteSession({ sessionId: 'current' });
	} catch {
		// Always clear the local cookie even if the remote session is already gone.
	}

	clearAppwriteSessionCookie(response);

	return response;
};

const handleAppwriteResetRequest = async (request: NextRequest) => {
	const body = await request.json();
	const email = getRequiredString(body.email);

	if (!email) {
		return jsonError('Email is required.', 400);
	}

	try {
		const account = createAppwriteAdminAccount(getUserAgent(request));
		await account.createRecovery({
			email,
			url: buildAppUrl('/reset-password'),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to send password reset email.'),
			getAppwriteErrorStatus(error, 400)
		);
	}
};

const handleAppwriteResetComplete = async (request: NextRequest) => {
	const body = await request.json();
	const userId = getRequiredString(body.userId);
	const secret = getRequiredString(body.secret);
	const password = getRequiredString(body.password);

	if (!userId || !secret || !password) {
		return jsonError('User ID, secret, and password are required.', 400);
	}

	try {
		const account = createAppwriteAdminAccount(getUserAgent(request));
		await account.updateRecovery({ userId, secret, password });

		return NextResponse.json({ success: true });
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to update password.'),
			getAppwriteErrorStatus(error, 400)
		);
	}
};

const handleAppwriteChangePassword = async (request: NextRequest) => {
	const body = await request.json();
	const oldPassword = getRequiredString(body.oldPassword);
	const newPassword = getRequiredString(body.newPassword);

	if (!oldPassword || !newPassword) {
		return jsonError('Current password and new password are required.', 400);
	}

	try {
		const sessionSecret = getAppwriteSessionSecret(request);
		if (!sessionSecret) {
			return jsonError('Not authenticated.', 401);
		}
		const account = createAppwriteSessionAccount(sessionSecret, getUserAgent(request));
		await account.updatePassword(newPassword, oldPassword);

		return NextResponse.json({ success: true });
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to change password.'),
			getAppwriteErrorStatus(error, 400)
		);
	}
};

const handleAppwriteVerifyEmail = async (request: NextRequest) => {
	const body = await request.json();
	const userId = getRequiredString(body.userId);
	const secret = getRequiredString(body.secret);

	if (!userId || !secret) {
		return jsonError('User ID and secret are required.', 400);
	}

	try {
		const account = createAppwriteAdminAccount(getUserAgent(request));
		await account.updateEmailVerification({ userId, secret });

		return NextResponse.json({ success: true });
	} catch (error) {
		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to verify email.'),
			getAppwriteErrorStatus(error, 400)
		);
	}
};

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ all: string[] }> }
) {
	const routePath = await getRoutePath(params);

	if (routePath === 'session') {
		return handleAppwriteSession(request);
	}

	return jsonError('Not found.', 404);
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ all: string[] }> }
) {
	const routePath = await getRoutePath(params);

	switch (routePath) {
		case 'sign-in/email':
		case 'sign-up/email':
		case 'reset-password': {
			const limited = checkRateLimit(request, AUTH_RATE_LIMIT);
			if (limited) return limited;
			break;
		}
	}

	switch (routePath) {
		case 'sign-in/email':
			return handleAppwriteSignIn(request);
		case 'sign-up/email':
			return handleAppwriteSignUp(request);
		case 'sign-out':
			return handleAppwriteSignOut(request);
		case 'reset-password':
			return handleAppwriteResetRequest(request);
		default:
			return jsonError('Not found.', 404);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ all: string[] }> }
) {
	const routePath = await getRoutePath(params);

	switch (routePath) {
		case 'reset-password':
			return handleAppwriteResetComplete(request);
		case 'change-password':
			return handleAppwriteChangePassword(request);
		case 'verify-email':
			return handleAppwriteVerifyEmail(request);
		default:
			return jsonError('Not found.', 404);
	}
}
