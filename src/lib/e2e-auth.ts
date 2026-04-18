import type { NextRequest } from 'next/server';

export const E2E_AUTH_COOKIE_NAME = 'skillogue_e2e_auth';
export const E2E_AUTH_ADMIN_COOKIE_VALUE = 'admin';
export const E2E_AUTH_HEADER_NAME = 'x-skillogue-e2e-auth';

const E2E_ADMIN_SESSION = {
  user: {
    id: 'e2e-admin',
    email: 'cata.walter@gmail.com',
    name: 'E2E Admin',
  },
  expires: '2099-01-01T00:00:00.000Z',
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