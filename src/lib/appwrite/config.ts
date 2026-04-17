const normalizeEnv = (value?: string) => value?.trim() ?? '';

export const getAppwriteEndpoint = () =>
  normalizeEnv(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);

export const getAppwriteProjectId = () =>
  normalizeEnv(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

export const getAppwriteDatabaseId = () =>
  normalizeEnv(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);

export const getAppwriteSessionCookieName = () => {
  const projectId = getAppwriteProjectId();

  return projectId ? `a_session_${projectId}` : 'a_session';
};

export const getAppUrl = () =>
  normalizeEnv(process.env.NEXT_PUBLIC_APP_URL) || 'http://localhost:3000';

export const isAppwritePublicConfigReady = () =>
  Boolean(getAppwriteEndpoint() && getAppwriteProjectId());