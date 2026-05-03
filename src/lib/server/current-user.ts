import { auth, currentUser } from '@clerk/nextjs/server';
import { headers, cookies } from 'next/headers';
import { type NextRequest } from 'next/server';
import {
  E2E_AUTH_COOKIE_NAME,
  E2E_AUTH_ALICE_COOKIE_VALUE,
  E2E_AUTH_INCOMPLETE_COOKIE_VALUE,
  E2E_ALICE_USER_ID,
  E2E_INCOMPLETE_USER_ID,
  getE2EUserSession,
} from '@/lib/e2e-auth';

export interface CurrentAuthUser {
  id: string;
  email: string;
  name?: string;
}

const getE2EUserFromServerCookies = async (): Promise<CurrentAuthUser | null> => {
  try {
    const headerStore = await headers();
    const host = headerStore.get('host') ?? '';
    if (!host.startsWith('localhost:') && !host.startsWith('127.0.0.1:')) {
      return null;
    }
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(E2E_AUTH_COOKIE_NAME)?.value;
    if (cookieValue === E2E_AUTH_ALICE_COOKIE_VALUE) {
      return { id: E2E_ALICE_USER_ID, email: 'alice@example.com', name: 'Alice Johnson' };
    }
    if (cookieValue === E2E_AUTH_INCOMPLETE_COOKIE_VALUE) {
      return { id: E2E_INCOMPLETE_USER_ID, email: 'e2e.incomplete@example.com', name: 'E2E Incomplete' };
    }
  } catch {
    // Not in a server context where headers/cookies are available
  }
  return null;
};

export const getCurrentUserFromRequest = async (request: NextRequest): Promise<CurrentAuthUser | null> => {
  const e2eUser = getE2EUserSession(request);
  if (e2eUser) return e2eUser;

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  return {
    id: userId,
    email: primaryEmail,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
  };
};

export const getCurrentUserFromCookies = async (): Promise<CurrentAuthUser | null> => {
  const e2eUser = await getE2EUserFromServerCookies();
  if (e2eUser) return e2eUser;

  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ?? '';

  return {
    id: userId,
    email: primaryEmail,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined,
  };
};
