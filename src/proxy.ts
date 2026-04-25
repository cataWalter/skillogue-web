import { NextResponse, type NextRequest } from 'next/server';
import { getAppwriteSessionCookieName } from '@/lib/appwrite/config';

type SessionUser = {
  id: string;
};

type ProfileCompletionState = 'complete' | 'incomplete' | 'unknown';

const getForwardedHeaders = (request: NextRequest) => ({
  cookie: request.headers.get('cookie') ?? '',
  'user-agent': request.headers.get('user-agent') ?? '',
});

const getVerifiedSessionUser = async (request: NextRequest, sessionToken?: string) => {
  if (!sessionToken) {
    return null;
  }

  try {
    const response = await fetch(new URL('/api/auth/session', request.url), {
      headers: getForwardedHeaders(request),
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return data?.session?.user ?? null;
  } catch {
    return null;
  }
};

const getProfileCompletionState = async (
  request: NextRequest,
  userId: string
): Promise<ProfileCompletionState> => {
  try {
    const response = await fetch(new URL(`/api/profile/${userId}`, request.url), {
      headers: getForwardedHeaders(request),
      cache: 'no-store',
    });

    if (response.status === 404) {
      return 'incomplete';
    }

    if (!response.ok) {
      return 'unknown';
    }

    const profile = await response.json();

    return typeof profile?.first_name === 'string' && profile.first_name.trim().length > 0
      ? 'complete'
      : 'incomplete';
  } catch {
    return 'unknown';
  }
};

export async function proxy(request: NextRequest) {
  const sessionCookieName = getAppwriteSessionCookieName();
  const sessionToken = request.cookies.get(sessionCookieName)?.value;

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/dashboard', '/favorites', '/messages', '/notifications', '/settings', '/profile', '/edit-profile', '/onboarding', '/search', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Auth routes to redirect away from if already logged in
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const shouldCheckSession = Boolean(sessionToken) && (isProtectedRoute || isAuthRoute);
  const sessionUser = shouldCheckSession
    ? await getVerifiedSessionUser(request, sessionToken)
    : null;
  const isAuthenticated = shouldCheckSession
    ? Boolean(sessionUser)
    : Boolean(sessionToken);
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');
  const shouldCheckProfileCompletion = Boolean(sessionUser) && (isProtectedRoute || isAuthRoute);
  const profileCompletion = shouldCheckProfileCompletion && sessionUser
    ? await getProfileCompletionState(request, sessionUser.id)
    : 'unknown';

  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If logged in with an incomplete profile, always funnel protected routes through onboarding.
  if (isProtectedRoute && isAuthenticated && profileCompletion === 'incomplete' && !isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }

  // If trying to access auth route with session, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = profileCompletion === 'incomplete' ? '/onboarding' : '/dashboard';
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
