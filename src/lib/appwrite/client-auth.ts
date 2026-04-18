// Stub for compatibility with imports
export const fetchAuthSession = async () => ({
  $id: 'test-session',
  user: { id: '123', email: 'test@example.com' },
});

export const fetchAuthUser = async () => ({
  session: { $id: 'test-session' },
});

export const signOutAuth = async () => {};
