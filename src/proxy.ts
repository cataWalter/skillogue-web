import { Client, Account, Databases, Query } from 'appwrite';
import { NextResponse, type NextRequest } from 'next/server';
import {
  getAppwriteCollectionId,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  getAppwriteSessionCookieName,
} from '@/lib/appwrite/config';
import { getE2EAdminSession } from '@/lib/e2e-auth';

type ProfileCompletionState = 'complete' | 'incomplete' | 'unknown';

const createEdgeClient = (sessionSecret: string) => {
  const client = new Client()
    .setEndpoint(getAppwriteEndpoint())
    .setProject(getAppwriteProjectId());

  client.setSession(sessionSecret);

  return client;
};

const getCurrentUser = async (sessionSecret: string) => {
  try {
    const client = createEdgeClient(sessionSecret);
    const account = new Account(client);
    const user = await account.get();
    return { id: user.$id, email: user.email };
  } catch {
    return null;
  }
};

const getProfileCompletionState = async (
  sessionSecret: string,
  userId: string,
): Promise<ProfileCompletionState> => {
  try {
    const client = createEdgeClient(sessionSecret);
    const databases = new Databases(client);
    const response = await databases.listDocuments(
      getAppwriteDatabaseId(),
      getAppwriteCollectionId('profiles'),
      [Query.equal('id', userId), Query.limit(1)],
    );
    const profile = response.documents[0] as { first_name?: string | null } | undefined;

    if (!profile) {
      return 'incomplete';
    }

    return typeof profile?.first_name === 'string' && profile.first_name.trim().length > 0
      ? 'complete'
      : 'incomplete';
  } catch {
    return 'unknown';
  }
};

export async function proxy(request: NextRequest) {
  const e2eSession = getE2EAdminSession(request);
  const sessionCookieName = getAppwriteSessionCookieName();
  const sessionToken = request.cookies.get(sessionCookieName)?.value;
  const isHomeRoute = request.nextUrl.pathname === '/';

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/dashboard', '/favorites', '/messages', '/notifications', '/settings', '/profile', '/edit-profile', '/onboarding', '/search', '/user'];
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  // Auth routes to redirect away from if already logged in
  const authRoutes = ['/login', '/signup', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route));
  const shouldCheckSession = !e2eSession && Boolean(sessionToken) && (isProtectedRoute || isAuthRoute || isHomeRoute);
  const sessionUser = e2eSession?.user ?? (shouldCheckSession && sessionToken
    ? await getCurrentUser(sessionToken)
    : null);
  const isAuthenticated = Boolean(e2eSession) || (shouldCheckSession
    ? Boolean(sessionUser)
    : Boolean(sessionToken));
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');
  const shouldCheckProfileCompletion = !e2eSession && Boolean(sessionUser) && (isProtectedRoute || isAuthRoute || isHomeRoute);
  const profileCompletion = e2eSession
    ? 'complete'
    : shouldCheckProfileCompletion && sessionUser && sessionToken
    ? await getProfileCompletionState(sessionToken, sessionUser.id)
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

  // If trying to access the home or auth routes with a verified session, redirect away.
  if ((isAuthRoute || isHomeRoute) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = profileCompletion === 'incomplete' ? '/onboarding' : '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}


