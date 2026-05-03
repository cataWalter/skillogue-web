import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse, type NextRequest } from 'next/server';
import { getE2EAdminSession, getE2EUserSession } from '@/lib/e2e-auth';

const protectedRoutes = [
  '/admin', '/dashboard', '/favorites', '/messages',
  '/notifications', '/settings', '/profile', '/edit-profile',
  '/onboarding', '/search', '/user',
];
const authRoutes = ['/login', '/signup', '/forgot-password'];

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  const e2eAdminSession = getE2EAdminSession(request);
  const e2eUserSession = getE2EUserSession(request);

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );
  const isHomeRoute = request.nextUrl.pathname === '/';

  let isAuthenticated = Boolean(e2eAdminSession) || Boolean(e2eUserSession);

  if (!isAuthenticated) {
    const { userId } = await auth();
    isAuthenticated = Boolean(userId);
  }

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if ((isAuthRoute || isHomeRoute) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|js|css|woff|woff2|ttf|eot)).*)',
  ],
};
