import { Account, Client, Users, Databases } from 'node-appwrite';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAppUrl,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteDatabaseId,
  getAppwriteSessionCookieName,
  isAppwritePublicConfigReady,
} from '@/lib/appwrite/config';

const getAppwriteApiKey = () => process.env.APPWRITE_API_KEY?.trim() ?? '';

const assertAppwriteServerConfig = () => {
  if (!isAppwritePublicConfigReady() || !getAppwriteApiKey() || !getAppwriteDatabaseId()) {
    throw new Error('Appwrite server configuration is incomplete.');
  }
};

const createBaseClient = (userAgent?: string) => {
  const client = new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId());

  if (userAgent) {
    client.setForwardedUserAgent(userAgent);
  }

  return client;
};

const getSessionCookieOptions = (expiresAt?: string) => {
  if (expiresAt) {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      expires: new Date(expiresAt),
    };
  }

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 0,
  };
};

export const createAppwriteAdminAccount = (userAgent?: string) => {
  assertAppwriteServerConfig();

  return new Account(createBaseClient(userAgent).setKey(getAppwriteApiKey()));
};

export const createAppwriteAdminUsers = (userAgent?: string) => {
  assertAppwriteServerConfig();

  return new Users(createBaseClient(userAgent).setKey(getAppwriteApiKey()));
};

export const createAppwriteAdminDatabases = (userAgent?: string) => {
  assertAppwriteServerConfig();

  return new Databases(createBaseClient(userAgent).setKey(getAppwriteApiKey()));
};

export const createAppwriteSessionAccount = (
  sessionSecret: string,
  userAgent?: string
) => {
  assertAppwriteServerConfig();

  return new Account(createBaseClient(userAgent).setSession(sessionSecret));
};

export const createAppwriteSessionDatabases = (
  sessionSecret: string,
  userAgent?: string
) => {
  assertAppwriteServerConfig();

  return new Databases(createBaseClient(userAgent).setSession(sessionSecret));
};

export const getAppwriteSessionSecret = (request: NextRequest) =>
  request.cookies.get(getAppwriteSessionCookieName())?.value;

export const setAppwriteSessionCookie = (
  response: NextResponse,
  secret: string,
  expiresAt: string
) => {
  response.cookies.set(
    getAppwriteSessionCookieName(),
    secret,
    getSessionCookieOptions(expiresAt)
  );
};

export const clearAppwriteSessionCookie = (response: NextResponse) => {
  response.cookies.set(
    getAppwriteSessionCookieName(),
    '',
    getSessionCookieOptions()
  );
};

export const buildAppUrl = (pathname: string) =>
  new URL(pathname, getAppUrl()).toString();

export const getAppwriteErrorStatus = (error: unknown, fallback = 500) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'number'
  ) {
    return (error as { code: number }).code;
  }

  return fallback;
};

export const getAppwriteErrorMessage = (
  error: unknown,
  fallback = 'Request failed.'
) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
};