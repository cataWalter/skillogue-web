import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url || !url.trim()) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isValidSupabaseUrl(url)) {
    throw new Error(
      'Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Please check your environment variables.'
    );
  }
  return url as string;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !key.trim()) {
    throw new Error(
      'Invalid or missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your environment variables.'
    );
  }
  return key;
};

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip Supabase operations if environment variables are not configured
  try {
    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Protected routes
    const protectedRoutes = ['/dashboard', '/messages', '/settings', '/profile', '/edit-profile', '/onboarding', '/search', '/user']
    const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    if (!user && isProtectedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Optional: Redirect logged in users away from auth pages
    const authRoutes = ['/login', '/signup', '/forgot-password']
    const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // Environment variables not configured - log warning and continue
    console.warn('Supabase environment variables not configured, skipping auth middleware:', error);
  }

  return response
}
