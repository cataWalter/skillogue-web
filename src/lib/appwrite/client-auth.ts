export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
}

interface SessionResponse {
  session?: AuthSession | null;
}

export const fetchAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const response = await fetch('/api/auth/session');

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SessionResponse;

    return data.session ?? null;
  } catch (error) {
    console.error('Error fetching auth session:', error);
    return null;
  }
};

export const fetchAuthUser = async (): Promise<AuthUser | null> => {
  const session = await fetchAuthSession();

  return session?.user ?? null;
};

export const signOutAuth = async () => {
  await fetch('/api/auth/sign-out', { method: 'POST' });
};