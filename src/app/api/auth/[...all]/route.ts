import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { isAdminEmail } from '@/lib/admin';

export const runtime = 'nodejs';

const AUTH_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

const jsonError = (message: string, status = 400) => NextResponse.json({ message }, { status });

const getRoutePath = async (params: Promise<{ all: string[] }>) => {
  const { all } = await params;
  return all.join('/');
};

/** GET /api/auth/session — return the active Clerk session or null */
const handleSession = async () => {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ session: null });
  }

  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ session: null });
  }

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  return NextResponse.json({
    session: {
      user: {
        id: userId,
        email: primaryEmail,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
        isAdmin: isAdminEmail(primaryEmail),
      },
      expires: null,
    },
  });
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const routePath = await getRoutePath(params);
  if (routePath === 'session') return handleSession();
  return jsonError('Not found.', 404);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const routePath = await getRoutePath(params);

  if (
    routePath === 'sign-in/email' ||
    routePath === 'sign-up/email' ||
    routePath === 'reset-password'
  ) {
    const limited = checkRateLimit(request, AUTH_RATE_LIMIT);
    if (limited) return limited;
  }

  // Clerk handles sign-in, sign-up, sign-out, and password reset on the client.
  return jsonError('Use Clerk client-side auth. This route is no longer active.', 410);
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ all: string[] }> }
) {
  const routePath = await getRoutePath(params);
  if (routePath === 'session') return handleSession();
  return jsonError('Use Clerk client-side auth. This route is no longer active.', 410);
}

export async function DELETE(
  _request: NextRequest,
  _context: unknown
) {
  return jsonError('Use Clerk client-side auth. This route is no longer active.', 410);
}
