import type { NextRequest } from 'next/server';

export const E2E_AUTH_COOKIE_NAME = 'skillogue_e2e_auth';
export const E2E_AUTH_ADMIN_COOKIE_VALUE = 'admin';
export const E2E_AUTH_ALICE_COOKIE_VALUE = 'alice';
export const E2E_AUTH_INCOMPLETE_COOKIE_VALUE = 'incomplete';
export const E2E_AUTH_HEADER_NAME = 'x-skillogue-e2e-auth';

// Fixed user IDs for E2E test users — must match profile data seeded in Turso
export const E2E_ALICE_USER_ID = 'e2e-alice-00000000-0000-0000-0000-000000000001';
export const E2E_INCOMPLETE_USER_ID = 'e2e-incomplete-0000-0000-0000-000000000002';

// Sentinel emails used in E2E tests to exercise specific auth action flows
// without making real Clerk API calls.  Only active on localhost.
export const E2E_UNVERIFIED_EMAIL = 'e2e.unverified@example.com';
export const E2E_SIGNUP_SUCCESS_EMAIL = 'e2e.signup@example.com';
export const E2E_RESET_PASSWORD_EMAIL = 'e2e.resetpw@example.com';

const E2E_ADMIN_SESSION = {
  user: {
    id: 'e2e-admin',
    email: 'cata.walter@gmail.com',
    name: 'E2E Admin',
    isAdmin: true,
  },
  expires: '2099-01-01T00:00:00.000Z',
};

const E2E_ALICE_USER = {
  id: E2E_ALICE_USER_ID,
  email: 'alice@example.com',
  name: 'Alice Johnson',
};

const E2E_INCOMPLETE_USER = {
  id: E2E_INCOMPLETE_USER_ID,
  email: 'e2e.incomplete@example.com',
  name: 'E2E Incomplete',
};

const getCookieHeaderValue = (cookieHeader: string | null, name: string) => {
  for (const part of (cookieHeader ?? '').split(';')) {
    const segment = part.trim();

    if (!segment) {
      continue;
    }

    const separatorIndex = segment.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    if (segment.slice(0, separatorIndex) === name) {
      return segment.slice(separatorIndex + 1);
    }
  }

  return null;
};

const getCookieValue = (request: Request | NextRequest, name: string) => {
  if ('cookies' in request && request.cookies && typeof request.cookies.get === 'function') {
    return request.cookies.get(name)?.value ?? null;
  }

  return getCookieHeaderValue(request.headers.get('cookie'), name);
};

const getRequestHostname = (request: Request | NextRequest) => {
  if ('nextUrl' in request && request.nextUrl) {
    return request.nextUrl.hostname;
  }

  return new URL(request.url).hostname;
};

const isLocalRequest = (request: Request | NextRequest) => {
  const hostname = getRequestHostname(request);

  return hostname === '127.0.0.1' || hostname === 'localhost';
};

export const getE2EAdminSession = (request: Request | NextRequest) => {
  if (!isLocalRequest(request)) {
    return null;
  }

  if (request.headers.get(E2E_AUTH_HEADER_NAME) !== E2E_AUTH_ADMIN_COOKIE_VALUE) {
    return null;
  }

  if (getCookieValue(request, E2E_AUTH_COOKIE_NAME) !== E2E_AUTH_ADMIN_COOKIE_VALUE) {
    return null;
  }

  return E2E_ADMIN_SESSION;
};

/**
 * Returns a mock user when the E2E alice or incomplete cookie is present on localhost.
 * Used by getCurrentUserFromCookies / getCurrentUserFromRequest to bypass Clerk in e2e tests.
 */
export const getE2EUserSession = (request: Request | NextRequest) => {
  if (!isLocalRequest(request)) {
    return null;
  }

  const cookieValue = getCookieValue(request, E2E_AUTH_COOKIE_NAME);

  if (cookieValue === E2E_AUTH_ALICE_COOKIE_VALUE) {
    return E2E_ALICE_USER;
  }

  if (cookieValue === E2E_AUTH_INCOMPLETE_COOKIE_VALUE) {
    return E2E_INCOMPLETE_USER;
  }

  return null;
};
