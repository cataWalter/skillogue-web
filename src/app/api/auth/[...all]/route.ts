import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
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
} from '@/lib/appwrite/server';

export const runtime = 'nodejs';

const EMAIL_VERIFICATION_REQUIRED_MESSAGE =
	'Please verify your email before signing in. Check your inbox and wait to verify the email.';
const INVALID_PASSWORD_RESET_LINK_MESSAGE =
	'Invalid or expired link. Please request a new password reset.';
const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;
const PASSWORD_RESET_TOKEN_TTL_HOURS = 1;
const DEFAULT_BREVO_SENDER_NAME = 'Skillogue';
const DEFAULT_BREVO_SENDER_EMAIL = 'cata.walter@gmail.com';

const jsonError = (message: string, status = 400) =>
	NextResponse.json({ message }, { status });

const createSignedOutSessionResponse = () => {
	const response = NextResponse.json({ session: null });
	clearAppwriteSessionCookie(response);
	return response;
};

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

type AppwriteSessionUser = {
	$id: string;
	email: string;
	name?: string | null;
	emailVerification?: boolean;
};

type PasswordResetTokenPayload = {
	userId: string;
	email: string;
	passwordUpdate: string;
	exp: number;
};

const buildSessionPayload = (user: AppwriteSessionUser, expires: string) => ({
	session: {
		user: {
			id: user.$id,
			email: user.email,
			name: user.name ?? undefined,
		},
		expires,
	},
});

const getPasswordResetSecret = () =>
	process.env.PASSWORD_RESET_TOKEN_SECRET?.trim() || process.env.APPWRITE_API_KEY?.trim() || '';

const getBrevoApiKey = () =>
	process.env.BREVO_API_KEY?.trim() || process.env.SENDINBLUE_API_KEY?.trim() || '';

const getBrevoSenderEmail = () =>
	process.env.BREVO_SENDER_EMAIL?.trim() ||
	process.env.PASSWORD_RESET_FROM_EMAIL?.trim() ||
	DEFAULT_BREVO_SENDER_EMAIL;

const getBrevoSenderName = () =>
	process.env.BREVO_SENDER_NAME?.trim() ||
	process.env.PASSWORD_RESET_FROM_NAME?.trim() ||
	DEFAULT_BREVO_SENDER_NAME;

const getBrevoReplyToEmail = () =>
	process.env.BREVO_REPLY_TO_EMAIL?.trim() ||
	process.env.PASSWORD_RESET_REPLY_TO_EMAIL?.trim() ||
	getBrevoSenderEmail();

const getBrevoReplyToName = () =>
	process.env.BREVO_REPLY_TO_NAME?.trim() ||
	process.env.PASSWORD_RESET_REPLY_TO_NAME?.trim() ||
	getBrevoSenderName();

const signPasswordResetToken = (payload: PasswordResetTokenPayload) => {
	const secret = getPasswordResetSecret();

	if (!secret) {
		throw new Error('Password reset signing secret is not configured.');
	}

	const payloadPart = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signaturePart = createHmac('sha256', secret)
		.update(payloadPart)
		.digest('base64url');

	return `${payloadPart}.${signaturePart}`;
};

const parsePasswordResetToken = (token: string): PasswordResetTokenPayload => {
	const secret = getPasswordResetSecret();

	if (!secret) {
		throw new Error('Password reset signing secret is not configured.');
	}

	const [payloadPart, signaturePart, ...rest] = token.split('.');

	if (!payloadPart || !signaturePart || rest.length > 0) {
		throw new Error(INVALID_PASSWORD_RESET_LINK_MESSAGE);
	}

	const actualSignature = Buffer.from(signaturePart, 'base64url');
	const expectedSignature = createHmac('sha256', secret).update(payloadPart).digest();

	if (
		actualSignature.length !== expectedSignature.length ||
		!timingSafeEqual(actualSignature, expectedSignature)
	) {
		throw new Error(INVALID_PASSWORD_RESET_LINK_MESSAGE);
	}

	const parsedPayload = JSON.parse(
		Buffer.from(payloadPart, 'base64url').toString('utf8')
	) as Partial<PasswordResetTokenPayload>;

	if (
		typeof parsedPayload.userId !== 'string' ||
		typeof parsedPayload.email !== 'string' ||
		typeof parsedPayload.passwordUpdate !== 'string' ||
		typeof parsedPayload.exp !== 'number'
	) {
		throw new Error(INVALID_PASSWORD_RESET_LINK_MESSAGE);
	}

	if (parsedPayload.exp <= Date.now()) {
		throw new Error(INVALID_PASSWORD_RESET_LINK_MESSAGE);
	}

	return {
		userId: parsedPayload.userId,
		email: parsedPayload.email,
		passwordUpdate: parsedPayload.passwordUpdate,
		exp: parsedPayload.exp,
	};
};

const buildPasswordResetLink = (userId: string, token: string) => {
	const resetUrl = new URL(buildAppUrl('/reset-password'));

	resetUrl.searchParams.set('userId', userId);
	resetUrl.searchParams.set('secret', token);

	return resetUrl.toString();
};

const buildPasswordResetEmailContent = (resetUrl: string) => ({
	subject: 'Reset your Skillogue password',
	textContent: [
		'Reset your Skillogue password',
		'',
		`Open this link to choose a new password: ${resetUrl}`,
		'',
		`This link expires in ${PASSWORD_RESET_TOKEN_TTL_HOURS} hour.`,
		'',
		"If you didn't request this, you can ignore this email.",
		'',
		'Skillogue',
	].join('\n'),
	htmlContent: [
		'<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">',
		'<p style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;color:#4f46e5;font-weight:700;margin:0 0 12px;">Skillogue</p>',
		'<h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;">Reset your password</h1>',
		'<p style="margin:0 0 24px;">Use the button below to choose a new password for your Skillogue account.</p>',
		`<p style="margin:0 0 24px;"><a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;">Reset password</a></p>`,
		`<p style="margin:0 0 16px;font-size:14px;color:#4b5563;">This link expires in ${PASSWORD_RESET_TOKEN_TTL_HOURS} hour.</p>`,
		`<p style="margin:0 0 16px;font-size:14px;color:#4b5563;">If the button does not work, copy and paste this link into your browser:<br /><a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a></p>`,
		'<p style="margin:0;font-size:14px;color:#4b5563;">If you did not request this, you can ignore this email.</p>',
		'</div>',
	].join(''),
});

const getBrevoErrorMessage = async (response: Response) => {
	try {
		const payload = (await response.json()) as {
			message?: string;
			code?: string;
			error?: string;
		};

		return payload.message || payload.error || payload.code || 'Brevo request failed.';
	} catch {
		return response.statusText || 'Brevo request failed.';
	}
};

const sendPasswordResetEmail = async (recipientEmail: string, resetUrl: string) => {
	const apiKey = getBrevoApiKey();

	if (!apiKey) {
		throw new Error('Brevo API key is not configured.');
	}

	const senderEmail = getBrevoSenderEmail();
	const senderName = getBrevoSenderName();
	const replyToEmail = getBrevoReplyToEmail();
	const replyToName = getBrevoReplyToName();
	const emailContent = buildPasswordResetEmailContent(resetUrl);

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'api-key': apiKey,
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			sender: {
				email: senderEmail,
				name: senderName,
			},
			replyTo: {
				email: replyToEmail,
				name: replyToName,
			},
			to: [{ email: recipientEmail }],
			subject: emailContent.subject,
			textContent: emailContent.textContent,
			htmlContent: emailContent.htmlContent,
		}),
	});

	if (!response.ok) {
		throw new Error(await getBrevoErrorMessage(response));
	}
};

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

		if (user.emailVerification !== true) {
			try {
				await account.deleteSession({ sessionId: 'current' });
			} catch {
				// A failed cleanup should not keep an unverified user signed in locally.
			}

			return createSignedOutSessionResponse();
		}

		return NextResponse.json(buildSessionPayload(user, currentSession.expire));
	} catch {
		return createSignedOutSessionResponse();
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

		if (user.emailVerification !== true) {
			try {
				await sessionAccount.deleteSession({ sessionId: 'current' });
			} catch {
				// A failed cleanup should not override the verification requirement.
			}

			return jsonError(EMAIL_VERIFICATION_REQUIRED_MESSAGE, 403);
		}

		const response = NextResponse.json(buildSessionPayload(user, session.expire));

		setAppwriteSessionCookie(response, session.secret, session.expire);

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
		const users = createAppwriteAdminUsers(getUserAgent(request));
		const userList = await users.list({ search: email });
		const matchedUser = userList.users.find(
			(candidate) => candidate.email.toLowerCase() === email.toLowerCase()
		);

		if (matchedUser) {
			const token = signPasswordResetToken({
				userId: matchedUser.$id,
				email: matchedUser.email,
				passwordUpdate: matchedUser.passwordUpdate,
				exp: Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
			});
			const resetUrl = buildPasswordResetLink(matchedUser.$id, token);

			await sendPasswordResetEmail(matchedUser.email, resetUrl);
		}

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
		const tokenPayload = parsePasswordResetToken(secret);

		if (tokenPayload.userId !== userId) {
			return jsonError(INVALID_PASSWORD_RESET_LINK_MESSAGE, 400);
		}

		const users = createAppwriteAdminUsers(getUserAgent(request));
		const user = await users.get({ userId });

		if (
			user.email.toLowerCase() !== tokenPayload.email.toLowerCase() ||
			user.passwordUpdate !== tokenPayload.passwordUpdate
		) {
			return jsonError(INVALID_PASSWORD_RESET_LINK_MESSAGE, 400);
		}

		await users.updatePassword({ userId, password });

		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof Error && error.message === INVALID_PASSWORD_RESET_LINK_MESSAGE) {
			return jsonError(error.message, 400);
		}

		return jsonError(
			getAppwriteErrorMessage(error, 'Failed to update password.'),
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
		case 'verify-email':
			return handleAppwriteVerifyEmail(request);
		default:
			return jsonError('Not found.', 404);
	}
}