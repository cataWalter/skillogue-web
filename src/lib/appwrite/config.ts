const getEnvValue = (...keys: string[]) => {
	for (const key of keys) {
		const value = process.env[key]?.trim();

		if (value) {
			return value;
		}
	}

	return '';
};

const toEnvKeySegment = (value: string) => value.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();

export const getAppwriteEndpoint = () => getEnvValue('NEXT_PUBLIC_APPWRITE_ENDPOINT');

export const getAppwriteProjectId = () => getEnvValue('NEXT_PUBLIC_APPWRITE_PROJECT_ID');

export const getAppwriteDatabaseId = () =>
	getEnvValue('NEXT_PUBLIC_APPWRITE_DATABASE_ID', 'APPWRITE_DATABASE_ID');

export const getAppwriteApiKey = () => getEnvValue('APPWRITE_API_KEY');

export const getAppwriteSessionCookieName = () =>
	getEnvValue('APPWRITE_SESSION_COOKIE_NAME') || 'appwrite_session';

export const getAppwriteCollectionId = (name: string) =>
	getEnvValue(`APPWRITE_COLLECTION_${toEnvKeySegment(name)}_ID`) || name;

export const getAppwriteFunctionId = (name: string) =>
	getEnvValue(`APPWRITE_FUNCTION_${toEnvKeySegment(name)}_ID`);

export const isAppwritePublicConfigReady = () =>
	Boolean(getAppwriteEndpoint() && getAppwriteProjectId() && getAppwriteDatabaseId());

export const isAppwriteServerConfigReady = () =>
	Boolean(isAppwritePublicConfigReady() && getAppwriteApiKey());
