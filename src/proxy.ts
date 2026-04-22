import { NextResponse, type NextRequest } from 'next/server';
import { getAppwriteSessionCookieName } from '@/lib/appwrite/config';

const hasVerifiedSession = async (request: NextRequest, sessionToken?: string) => {
  if (!sessionToken) {
    return false;
  }

  try {
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
        'user-agent': request.headers.get('user-agent') ?? '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    return Boolean(data?.session?.user);
  } catch {
    return false;
  }
};

export async function proxy(request: NextRequest) {
  const sessionCookieName = getAppwriteSessionCookieName();
  const sessionToken = request.cookies.get(sessionCookieName)?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/messages', '/settings', '/profile', '/edit-profile', '/onboarding', '/search', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Auth routes to redirect away from if already logged in
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const shouldCheckSession = Boolean(sessionToken) && (isProtectedRoute || isAuthRoute);
  const isAuthenticated = shouldCheckSession
    ? await hasVerifiedSession(request, sessionToken)
    : Boolean(sessionToken);

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If trying to access auth route with session, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};