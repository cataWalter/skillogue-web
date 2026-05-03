import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../src/hooks/useAuth';
import { AuthProvider } from '../../src/context/AuthContext';

const mockUseUser = jest.fn();
const mockUseSignIn = jest.fn();
const mockUseSignUp = jest.fn();
const mockUseClerk = jest.fn();

jest.mock('@clerk/nextjs', () => ({
  useUser: () => mockUseUser(),
  useClerk: () => mockUseClerk(),
}));

jest.mock('@clerk/nextjs/legacy', () => ({
  useSignIn: () => mockUseSignIn(),
  useSignUp: () => mockUseSignUp(),
}));

jest.mock('../../src/lib/admin', () => ({
  isAdminEmail: jest.fn(() => false),
}));

const mockSignInCreate = jest.fn();
const mockSetSignInActive = jest.fn();
const mockSignUpCreate = jest.fn();
const mockPrepare = jest.fn();
const mockSignOut = jest.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({ user: null, isLoaded: true });
    mockUseSignIn.mockReturnValue({
      signIn: { create: mockSignInCreate },
      setActive: mockSetSignInActive,
    });
    mockUseSignUp.mockReturnValue({
      signUp: { create: mockSignUpCreate, prepareEmailAddressVerification: mockPrepare },
    });
    mockUseClerk.mockReturnValue({ signOut: mockSignOut });
  });

  it('returns loading=false when Clerk is loaded', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.loading).toBe(false);
  });

  it('returns loading=true when Clerk is not yet loaded', () => {
    mockUseUser.mockReturnValue({ user: null, isLoaded: false });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.loading).toBe(true);
  });

  it('returns the current user when authenticated', () => {
    mockUseUser.mockReturnValue({
      user: {
        id: 'user-123',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
        firstName: 'John',
        lastName: 'Doe',
      },
      isLoaded: true,
    });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user?.id).toBe('user-123');
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.session).not.toBeNull();
  });

  it('returns null user when not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('signIn calls Clerk and setActive on complete', async () => {
    mockSignInCreate.mockResolvedValue({ status: 'complete', createdSessionId: 'session-abc' });
    mockSetSignInActive.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => { await result.current.signIn('test@example.com', 'Password1!'); });
    expect(mockSignInCreate).toHaveBeenCalledWith({ identifier: 'test@example.com', password: 'Password1!' });
    expect(mockSetSignInActive).toHaveBeenCalledWith({ session: 'session-abc' });
  });

  it('signIn throws when status is not complete', async () => {
    mockSignInCreate.mockResolvedValue({ status: 'needs_second_factor' });
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await expect(act(async () => { await result.current.signIn('test@example.com', 'Password1!'); }))
      .rejects.toThrow('Sign in failed');
  });

  it('signUp creates account and prepares email verification', async () => {
    mockSignUpCreate.mockResolvedValue({});
    mockPrepare.mockResolvedValue({});
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    const res = await act(async () => result.current.signUp('test@example.com', 'Password1!'));
    expect(mockSignUpCreate).toHaveBeenCalledWith({ emailAddress: 'test@example.com', password: 'Password1!' });
    expect(res.requiresEmailVerification).toBe(true);
  });

  it('signOut calls Clerk signOut', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await act(async () => { await result.current.signOut(); });
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('provides all auth functions', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.changePassword).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
  });
});
