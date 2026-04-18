import { Account, AppwriteException, Client, Databases, Functions, Users } from 'node-appwrite';
import type { NextRequest, NextResponse } from 'next/server';
import {
	getAppwriteApiKey,
	getAppwriteDatabaseId,
	getAppwriteEndpoint,
	getAppwriteProjectId,
	getAppwriteSessionCookieName,
} from '@/lib/appwrite/config';

const DEFAULT_APP_URL = 'http://localhost:3000';

const assertConfigured = (value: string, name: string) => {
	if (!value) {
		throw new Error(`${name} is not configured.`);
	}

	return value;
};

const createBaseClient = (userAgent?: string) => {
	const client = new Client()
		.setEndpoint(assertConfigured(getAppwriteEndpoint(), 'NEXT_PUBLIC_APPWRITE_ENDPOINT'))
		.setProject(assertConfigured(getAppwriteProjectId(), 'NEXT_PUBLIC_APPWRITE_PROJECT_ID'));

	if (userAgent) {
		client.setForwardedUserAgent(userAgent);
	}

	return client;
};

const createAdminClient = (userAgent?: string) => {
	const client = createBaseClient(userAgent);

	client.setKey(assertConfigured(getAppwriteApiKey(), 'APPWRITE_API_KEY'));

	return client;
};

const createSessionClient = (sessionSecret: string, userAgent?: string) => {
	const client = createBaseClient(userAgent);

	client.setSession(sessionSecret);

	return client;
};

const parseCookieHeader = (cookieHeader: string | null, name: string) => {
	if (!cookieHeader) {
		return undefined;
	}

	for (const item of cookieHeader.split(';')) {
		const [rawKey, ...rawValue] = item.trim().split('=');

		if (rawKey === name) {
			return decodeURIComponent(rawValue.join('='));
		}
	}

	return undefined;
};

const getCookieValue = (request: Request | NextRequest, name: string) => {
	const nextRequest = request as NextRequest;

	if (nextRequest.cookies?.get) {
		return nextRequest.cookies.get(name)?.value;
	}

	return parseCookieHeader(request.headers.get('cookie'), name);
};

const isSecureCookie = () => {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

	if (appUrl) {
		try {
			const parsedUrl = new URL(appUrl);

			if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
				return false;
			}

			return parsedUrl.protocol === 'https:';
		} catch {
			// Fall through to the environment-based default below.
		}
	}

	return process.env.NODE_ENV === 'production';
};

export const buildAppUrl = (path = '/') => {
	const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;

	return new URL(path, baseUrl).toString();
};

export const createAppwriteAdminAccount = (userAgent?: string) =>
	new Account(createAdminClient(userAgent));

export const createAppwriteSessionAccount = (sessionSecret: string, userAgent?: string) =>
	new Account(createSessionClient(sessionSecret, userAgent));

export const createAppwriteAdminUsers = (userAgent?: string) =>
	new Users(createAdminClient(userAgent));

export const createAppwriteAdminDatabases = (userAgent?: string) =>
	new Databases(createAdminClient(userAgent));

export const createAppwriteSessionDatabases = (sessionSecret: string, userAgent?: string) =>
	new Databases(createSessionClient(sessionSecret, userAgent));

export const createAppwriteAdminFunctions = (userAgent?: string) =>
	new Functions(createAdminClient(userAgent));

export const getAppwriteSessionSecret = (request: Request | NextRequest) =>
	getCookieValue(request, getAppwriteSessionCookieName());

export const setAppwriteSessionCookie = (
	response: NextResponse,
	sessionSecret: string,
	expiresAt: string
) => {
	response.cookies.set({
		name: getAppwriteSessionCookieName(),
		value: sessionSecret,
		expires: new Date(expiresAt),
		httpOnly: true,
		sameSite: 'lax',
		secure: isSecureCookie(),
		path: '/',
	});
};

export const clearAppwriteSessionCookie = (response: NextResponse) => {
	response.cookies.set({
		name: getAppwriteSessionCookieName(),
		value: '',
		expires: new Date(0),
		httpOnly: true,
		sameSite: 'lax',
		secure: isSecureCookie(),
		path: '/',
	});
};

export const getAppwriteErrorStatus = (error: unknown, fallbackStatus = 500) => {
	if (error instanceof AppwriteException && typeof error.code === 'number') {
		return error.code;
	}

	if (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		typeof (error as { code?: unknown }).code === 'number'
	) {
		return (error as { code: number }).code;
	}

	return fallbackStatus;
};

export const getAppwriteErrorMessage = (error: unknown, fallbackMessage: string) => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof (error as { message?: unknown }).message === 'string'
	) {
		return (error as { message: string }).message;
	}

	return fallbackMessage;
};

export {
	getAppwriteApiKey,
	getAppwriteDatabaseId,
	getAppwriteEndpoint,
	getAppwriteProjectId,
	getAppwriteSessionCookieName,
};
