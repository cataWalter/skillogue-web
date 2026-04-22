import { NextRequest, NextResponse } from 'next/server';
import {
  clearAppwriteSessionCookie,
  createAppwriteSessionAccount,
  getAppwriteSessionSecret,
} from '@/lib/appwrite/server';

const getUserAgent = (request: NextRequest) => request.headers.get('user-agent') ?? undefined;

const createSignedOutResponse = () => {
  const response = NextResponse.json({ session: null });
  clearAppwriteSessionCookie(response);
  return response;
};

export async function GET(request: NextRequest) {
  const sessionSecret = getAppwriteSessionSecret(request);

  if (!sessionSecret) {
    return NextResponse.json({ session: null });
  }

  try {
    const account = createAppwriteSessionAccount(sessionSecret, getUserAgent(request));
    const [user, session] = await Promise.all([
      account.get(),
      account.getSession({ sessionId: 'current' }),
    ]);

    if (user.emailVerification !== true) {
      try {
        await account.deleteSession({ sessionId: 'current' });
      } catch {
        // A failed cleanup should not keep an unverified user signed in locally.
      }

      return createSignedOutResponse();
    }

    return NextResponse.json({
      session: {
        user: {
          id: user.$id,
          email: user.email,
          name: user.name ?? undefined,
        },
        expires: session.expire,
      },
    });
  } catch {
    return createSignedOutResponse();
  }
}
