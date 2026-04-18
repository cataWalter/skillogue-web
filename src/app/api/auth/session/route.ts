import { NextRequest, NextResponse } from 'next/server';
import {
  clearAppwriteSessionCookie,
  createAppwriteSessionAccount,
  getAppwriteSessionSecret,
} from '@/lib/appwrite/server';

const getUserAgent = (request: NextRequest) => request.headers.get('user-agent') ?? undefined;

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
    const response = NextResponse.json({ session: null });
    clearAppwriteSessionCookie(response);
    return response;
  }
}
