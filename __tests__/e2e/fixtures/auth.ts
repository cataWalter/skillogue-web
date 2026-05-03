import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { Client as AppwriteClient, Databases, Query, Users } from 'node-appwrite';
import type { Page } from '@playwright/test';
import { test as base, expect } from './test';

dotenv.config({ path: '.env', quiet: true });
dotenv.config({ path: '.env.local', quiet: true });

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

const getCollectionId = (name: string) =>
  getEnvValue(`APPWRITE_COLLECTION_${toEnvKeySegment(name)}_ID`) || name;

const appwriteEndpoint = getEnvValue('NEXT_PUBLIC_APPWRITE_ENDPOINT');
const appwriteProjectId = getEnvValue('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
const appwriteDatabaseId = getEnvValue('NEXT_PUBLIC_APPWRITE_DATABASE_ID', 'APPWRITE_DATABASE_ID');
const appwriteApiKey = getEnvValue('APPWRITE_API_KEY');
const profilesCollectionId = getCollectionId('profiles');

const getAdminClients = () => {
  if (!appwriteEndpoint || !appwriteProjectId || !appwriteDatabaseId || !appwriteApiKey) {
    throw new Error(
      'Missing one or more required env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID, NEXT_PUBLIC_APPWRITE_DATABASE_ID, APPWRITE_API_KEY'
    );
  }

  const client = new AppwriteClient()
    .setEndpoint(appwriteEndpoint)
    .setProject(appwriteProjectId)
    .setKey(appwriteApiKey);

  return {
    users: new Users(client),
    databases: new Databases(client),
  };
};

const findUserByEmail = async (email: string) => {
  const { users } = getAdminClients();
  const result = await users.list({
    queries: [Query.equal('email', email)],
    total: false,
  });

  return result.users[0] || null;
};

const ensureUserEmailVerified = async (userId: string) => {
  const { users } = getAdminClients();
  await users.updateEmailVerification({
    userId,
    emailVerification: true,
  });
};

const deleteExistingProfiles = async (userId: string) => {
  const { databases } = getAdminClients();
  const documentIds = new Set<string>();

  try {
    const profile = await databases.getDocument(appwriteDatabaseId, profilesCollectionId, userId);
    documentIds.add(profile.$id);
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 404) {
      throw error;
    }
  }

  const matchingProfiles = await databases.listDocuments(appwriteDatabaseId, profilesCollectionId, [
    Query.equal('id', [userId]),
    Query.limit(100),
  ]);

  for (const profile of matchingProfiles.documents) {
    documentIds.add(profile.$id);
  }

  for (const documentId of documentIds) {
    await databases.deleteDocument(appwriteDatabaseId, profilesCollectionId, documentId);
  }
};

const upsertProfile = async (
  userId: string,
  profile: { firstName: string; lastName: string; aboutMe: string; age: number; gender: string }
) => {
  const { databases } = getAdminClients();
  const payload = {
    id: userId,
    first_name: profile.firstName,
    last_name: profile.lastName,
    about_me: profile.aboutMe,
    age: profile.age,
    gender: profile.gender,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    await databases.getDocument(appwriteDatabaseId, profilesCollectionId, userId);
    await databases.updateDocument(appwriteDatabaseId, profilesCollectionId, userId, payload);
  } catch (error) {
    if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 404) {
      throw error;
    }
    await databases.createDocument(appwriteDatabaseId, profilesCollectionId, userId, payload);
  }
};

const ensureAliceUser = async () => {
  const email = 'alice@example.com';
  const password = 'Test1234!';
  const { users } = getAdminClients();

  let user = await findUserByEmail(email);

  if (!user) {
    try {
      user = await users.create({
        userId: randomUUID(),
        email,
        password,
        name: 'Alice Johnson',
      });
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 409) {
        throw error;
      }

      user = await findUserByEmail(email);
      if (!user) {
        throw error;
      }
    }
  }

  await ensureUserEmailVerified(user.$id);

  await upsertProfile(user.$id, {
    firstName: 'Alice',
    lastName: 'Johnson',
    aboutMe: 'Passionate about art and photography. Love exploring museums and capturing beautiful moments.',
    age: 28,
    gender: 'Female',
  });

  return { id: user.$id, email, password };
};

const ensureIncompleteProfileUser = async () => {
  const email = 'e2e.incomplete@example.com';
  const password = 'TestPassword123!';
  const { users } = getAdminClients();

  let user = await findUserByEmail(email);

  if (!user) {
    try {
      user = await users.create({
        userId: randomUUID(),
        email,
        password,
        name: 'E2E Incomplete Profile',
      });
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 409) {
        throw error;
      }

      user = await findUserByEmail(email);
      if (!user) {
        throw error;
      }
    }
  }

  await ensureUserEmailVerified(user.$id);

  await deleteExistingProfiles(user.$id);

  return {
    id: user.$id,
    email,
    password,
  };
};

const signInThroughBrowserContext = async (page: Page, credentials: { email: string; password: string }) => {
  await page.request.post('/api/auth/sign-out').catch(() => undefined);
  await page.context().clearCookies();

  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await page.waitForTimeout(1000 * attempt);
    }
    try {
      const response = await page.request.post('/api/auth/sign-in/email', {
        data: credentials,
      });

      if (!response.ok()) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || `Failed to sign in via API (${response.status()}).`);
      }
      return;
    } catch (e) {
      lastError = e as Error;
      if (!(e instanceof Error) || !e.message.includes('fetch failed')) {
        throw e;
      }
    }
  }
  throw lastError;
};

// ---------------------------------------------------------------------------
// Session state caches – populated once per worker process to avoid hitting
// Appwrite's sign-in rate limit when running many authenticated tests.
// ---------------------------------------------------------------------------
import type { Cookie } from '@playwright/test';

let cachedAliceStatePromise: Promise<Cookie[]> | null = null;
let cachedIncompleteStatePromise: Promise<Cookie[]> | null = null;

const getAliceCookies = (page: Page): Promise<Cookie[]> => {
  if (!cachedAliceStatePromise) {
    cachedAliceStatePromise = (async () => {
      const user = await ensureAliceUser();
      await signInThroughBrowserContext(page, { email: user.email, password: user.password });
      return page.context().cookies();
    })();
  }
  return cachedAliceStatePromise;
};

const getIncompleteCookies = (page: Page): Promise<Cookie[]> => {
  if (!cachedIncompleteStatePromise) {
    cachedIncompleteStatePromise = (async () => {
      const user = await ensureIncompleteProfileUser();
      await signInThroughBrowserContext(page, { email: user.email, password: user.password });
      return page.context().cookies();
    })();
  }
  return cachedIncompleteStatePromise;
};

/**
 * Restore a cached cookie state onto a fresh page context.
 * Falls back to a fresh sign-in if the cache is empty for this page.
 */
const restoreOrSignIn = async (
  page: Page,
  getCookies: (page: Page) => Promise<Cookie[]>
): Promise<void> => {
  const cookies = await getCookies(page);
  // If this context already ran the sign-in, its cookies are already set;
  // otherwise inject the cached cookies into the fresh context.
  const existing = await page.context().cookies();
  if (existing.length === 0) {
    await page.context().addCookies(cookies);
  }
};

/**
 * Custom test fixture that provides authenticated user functionality
 */
export const test = base.extend<{
  authenticatedPage: Page;
  incompleteProfilePage: Page;
  createTestUser: () => Promise<{ email: string; password: string; id: string }>;
}>({
  authenticatedPage: async ({ page }, providePage) => {
    try {
      await restoreOrSignIn(page, getAliceCookies);
    } catch (e) {
      console.log('Could not authenticate:', e);
      throw e;
    }

    await providePage(page);
  },

  incompleteProfilePage: async ({ page }, providePage) => {
    try {
      await restoreOrSignIn(page, getIncompleteCookies);
    } catch (e) {
      console.log('Could not authenticate incomplete profile user:', e);
      throw e;
    }

    await providePage(page);
  },

  createTestUser: async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    try {
      const { users } = getAdminClients();
      const user = await users.create({
        userId: randomUUID(),
        email: testEmail,
        password: testPassword,
        name: testEmail.split('@')[0],
      });

      await ensureUserEmailVerified(user.$id);

      return {
        email: testEmail,
        password: testPassword,
        id: user.$id,
      };
    } catch (e) {
      console.log('Error creating test user:', e);
      throw e;
    }
  },
});

export { expect };
