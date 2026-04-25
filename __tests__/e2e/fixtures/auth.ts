import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import { Client as AppwriteClient, Databases, Query, Users } from 'node-appwrite';
import { test as base, expect, Page } from '@playwright/test';

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

  await deleteExistingProfiles(user.$id);

  return {
    id: user.$id,
    email,
    password,
  };
};

const signInThroughBrowserContext = async (page: Page, credentials: { email: string; password: string }) => {
  await page.request.post('/api/auth/sign-out').catch(() => undefined);

  const response = await page.request.post('/api/auth/sign-in/email', {
    data: credentials,
  });

  expect(response.ok()).toBeTruthy();
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
    const testEmail = 'alice@example.com';
    const testPassword = 'Test1234!';

    try {
      await signInThroughBrowserContext(page, {
        email: testEmail,
        password: testPassword,
      });
      await page.goto('/');
    } catch (e) {
      console.log('Could not authenticate:', e);
    }

    await providePage(page);
  },

  incompleteProfilePage: async ({ page }, providePage) => {
    try {
      const user = await ensureIncompleteProfileUser();
      await signInThroughBrowserContext(page, {
        email: user.email,
        password: user.password,
      });
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
