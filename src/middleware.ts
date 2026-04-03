import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get session token from cookies
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/messages', '/settings', '/profile', '/edit-profile', '/onboarding', '/search', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  // Auth routes to redirect away from if already logged in
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  
  // If trying to access protected route without session, redirect to login
  if (isProtectedRoute && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  // If trying to access auth route with session, redirect to dashboard
  if (isAuthRoute && sessionToken) {
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