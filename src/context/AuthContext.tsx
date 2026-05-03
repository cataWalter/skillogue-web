'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useSignIn, useSignUp } from '@clerk/nextjs/legacy';
import { isAdminEmail } from '@/lib/admin';
import {
  E2E_AUTH_COOKIE_NAME,
  E2E_AUTH_ADMIN_COOKIE_VALUE,
  E2E_AUTH_ALICE_COOKIE_VALUE,
  E2E_AUTH_INCOMPLETE_COOKIE_VALUE,
  E2E_ALICE_USER_ID,
  E2E_INCOMPLETE_USER_ID,
  E2E_UNVERIFIED_EMAIL,
  E2E_SIGNUP_SUCCESS_EMAIL,
  E2E_RESET_PASSWORD_EMAIL,
} from '@/lib/e2e-auth';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  session: { user: AuthUser } | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getE2EAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null;
  const { hostname } = window.location;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return null;
  const cookieValue = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${E2E_AUTH_COOKIE_NAME}=`))
    ?.split('=')[1];
  if (cookieValue === E2E_AUTH_ADMIN_COOKIE_VALUE) {
    return { id: 'e2e-admin', email: 'cata.walter@gmail.com', name: 'E2E Admin', isAdmin: true };
  }
  if (cookieValue === E2E_AUTH_ALICE_COOKIE_VALUE) {
    return { id: E2E_ALICE_USER_ID, email: 'alice@example.com', name: 'Alice Johnson', isAdmin: false };
  }
  if (cookieValue === E2E_AUTH_INCOMPLETE_COOKIE_VALUE) {
    return { id: E2E_INCOMPLETE_USER_ID, email: 'e2e.incomplete@example.com', name: 'E2E Incomplete', isAdmin: false };
  }
  return null;
};

/** Returns true when running in a local E2E test environment. */
const isE2EContext = () =>
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signIn: clerkSignIn, setActive: setSignInActive } = useSignIn();
  const { signUp: clerkSignUp } = useSignUp();
  const { signOut: clerkSignOut } = useClerk();

  const e2eUser = getE2EAuthUser();

  const authUser: AuthUser | null = e2eUser ?? (clerkUser
    ? (() => {
        const email = clerkUser.primaryEmailAddress?.emailAddress ?? '';
        return {
          id: clerkUser.id,
          email,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || undefined,
          isAdmin: isAdminEmail(email),
        };
      })()
    : null);

  const session = authUser ? { user: authUser } : null;

  const signIn = async (email: string, password: string) => {
    // E2E bypass: simulate an unverified-email error so the login page can be tested
    // for its redirect logic without making a real Clerk API call.
    if (isE2EContext() && email === E2E_UNVERIFIED_EMAIL) {
      throw new Error('Please verify your email before signing in');
    }
    if (!clerkSignIn) throw new Error('Sign in not available');
    const result = await clerkSignIn.create({ identifier: email, password });
    if (result.status === 'complete') {
      await setSignInActive?.({ session: result.createdSessionId });
    } else {
      throw new Error('Sign in failed. Please try again.');
    }
  };

  const signUp = async (email: string, password: string) => {
    // E2E bypass: simulate a successful signup without creating a real Clerk account.
    if (isE2EContext() && email === E2E_SIGNUP_SUCCESS_EMAIL) {
      return { requiresEmailVerification: true };
    }
    if (!clerkSignUp) throw new Error('Sign up not available');
    await clerkSignUp.create({ emailAddress: email, password });
    await clerkSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    return { requiresEmailVerification: true };
  };

  const signOut = async () => {
    await clerkSignOut();
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!clerkUser) throw new Error('Not authenticated');
    await clerkUser.updatePassword({ currentPassword: oldPassword, newPassword });
  };

  const resetPassword = async (email: string) => {
    // E2E bypass: simulate a successful password-reset request so the forgot-password
    // page's confirmation screen can be tested without a real Clerk API call.
    if (isE2EContext() && email === E2E_RESET_PASSWORD_EMAIL) {
      return;
    }
    if (!clerkSignIn) throw new Error('Not available');
    await clerkSignIn.create({
      strategy: 'reset_password_email_code' as any,
      identifier: email,
    });
  };

  const refresh = useCallback(async () => {
    // Clerk auto-updates user state; nothing to do manually
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: authUser,
        loading: e2eUser ? false : !isLoaded,
        signIn,
        signUp,
        signOut,
        changePassword,
        resetPassword,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
