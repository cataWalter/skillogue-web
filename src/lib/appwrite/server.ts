// Stub: Appwrite server client is no longer used. Replaced by Clerk + Turso.
export const getAppwriteSessionSecret = (_request?: unknown) => null;
export const createAppwriteSessionAccount = (_sessionSecret?: unknown, _userAgent?: unknown) => { throw new Error('Removed'); };
export const createAppwriteAdminAccount = (_userAgent?: unknown) => { throw new Error('Removed'); };
export const createAppwriteAdminDatabases = (_userAgent?: unknown) => { throw new Error('Removed'); };
export const createAppwriteAdminUsers = (_userAgent?: unknown) => { throw new Error('Removed'); };
export const setAppwriteSessionCookie = () => {};
export const clearAppwriteSessionCookie = () => {};
export const getAppwriteErrorMessage = (_error: unknown, fallback: string) => fallback;
export const getAppwriteErrorStatus = (_error: unknown, fallback: number) => fallback;
export const buildAppUrl = (path: string) => `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}${path}`;
