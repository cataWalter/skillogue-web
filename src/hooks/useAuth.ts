import { useState, useEffect, useCallback } from 'react';

const readSession = async () => {
  const response = await fetch('/api/auth/session');

  if (!response || typeof response.json !== 'function') {
    throw new Error('Invalid session response');
  }

  const data = await response.json();

  return {
    session: data?.session ?? null,
    user: data?.session ? data.session.user : null,
  };
};

export const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      try {
        const data = await readSession();

        if (!active) {
          return;
        }

        setSession(data.session);
        setUser(data.user);
      } catch {
        if (!active) {
          return;
        }

        setSession(null);
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sign in');
    }
    
    const data = await response.json();
    setSession(data.session);
    setUser(data.session ? data.session.user : null);
  };

  const signUp = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sign up');
    }
    
    return response.json();
  };

  const signOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    setSession(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  const refresh = useCallback(async () => {
    try {
      const data = await readSession();
      setSession(data.session);
      setUser(data.user);
    } catch {
      setSession(null);
      setUser(null);
    }
  }, []);

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refresh,
  };
}
