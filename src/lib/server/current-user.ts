import { cookies } from 'next/headers';
import { type NextRequest } from 'next/server';
import { getAppwriteSessionCookieName } from '@/lib/appwrite/config';
import { createAppwriteSessionAccount } from '@/lib/appwrite/server';

export interface CurrentAuthUser {
  id: string;
  email: string;
  name?: string;
}

const mapAccountUser = (user: {
  $id: string;
  email: string;
  name?: string | null;
  emailVerification?: boolean;
}): CurrentAuthUser => ({
  id: user.$id,
  email: user.email,
  name: user.name ?? undefined,
});

const getUserFromSecret = async (sessionSecret?: string, userAgent?: string) => {
  if (!sessionSecret) {
    return null;
  }

  try {
    const account = createAppwriteSessionAccount(sessionSecret, userAgent);
    const user = await account.get();

    if (user.emailVerification !== true) {
      try {
        await account.deleteSession({ sessionId: 'current' });
      } catch {
        // Best effort cleanup only.
      }

      return null;
    }

    return mapAccountUser(user);
  } catch {
    return null;
  }
};

export const getCurrentUserFromRequest = async (request: NextRequest) =>
  getUserFromSecret(
    request.cookies.get(getAppwriteSessionCookieName())?.value,
    request.headers.get('user-agent') ?? undefined
  );

export const getCurrentUserFromCookies = async () => {
  const cookieStore = await cookies();

  return getUserFromSecret(cookieStore.get(getAppwriteSessionCookieName())?.value);
};
