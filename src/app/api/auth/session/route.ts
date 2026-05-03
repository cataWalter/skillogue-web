import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/admin';
import { getE2EAdminSession, getE2EUserSession } from '@/lib/e2e-auth';

export async function GET(request: NextRequest) {
  const e2eSession = getE2EAdminSession(request);

  if (e2eSession) {
    return NextResponse.json({ session: e2eSession });
  }

  const e2eUser = getE2EUserSession(request);

  if (e2eUser) {
    return NextResponse.json({
      session: {
        user: {
          id: e2eUser.id,
          email: e2eUser.email,
          name: e2eUser.name,
          isAdmin: false,
        },
        expires: null,
      },
    });
  }

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
}
