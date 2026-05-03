import dotenv from 'dotenv';
import { createClient } from '@libsql/client';
import type { Page } from '@playwright/test';
import { test as base, expect } from './test';
import {
  E2E_AUTH_COOKIE_NAME,
  E2E_AUTH_ALICE_COOKIE_VALUE,
  E2E_AUTH_INCOMPLETE_COOKIE_VALUE,
  E2E_ALICE_USER_ID,
  E2E_INCOMPLETE_USER_ID,
} from '../../../src/lib/e2e-auth';

dotenv.config({ path: '.env', quiet: true });
dotenv.config({ path: '.env.local', quiet: true });

// ---------------------------------------------------------------------------
// Turso seeding helpers (run once per worker via module-level promises)
// ---------------------------------------------------------------------------
const getTursoClient = () => {
  const url = process.env.TURSO_DATABASE_URL?.trim() ?? '';
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim() ?? '';
  if (!url) throw new Error('TURSO_DATABASE_URL is not set in .env.local');
  return createClient({ url, authToken: authToken || undefined });
};

const ensureAliceProfile = async () => {
  const client = getTursoClient();
  const now = new Date().toISOString();
  await client.execute({
    sql: `
      INSERT INTO profiles (id, first_name, last_name, about_me, gender, verified, created_at, updated_at)
      VALUES (?, 'Alice', 'Johnson',
        'Passionate about art and photography. Love exploring museums and capturing beautiful moments.',
        'woman', 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        about_me = excluded.about_me,
        updated_at = excluded.updated_at
    `,
    args: [E2E_ALICE_USER_ID, now, now],
  });
  await client.close();
};

const ensureIncompleteProfile = async () => {
  const client = getTursoClient();
  // Remove any existing profile so the page redirects to onboarding
  await client.execute({
    sql: `DELETE FROM profiles WHERE id = ?`,
    args: [E2E_INCOMPLETE_USER_ID],
  });
  await client.close();
};

// Seed once per worker process
let aliceSeedPromise: Promise<void> | null = null;
let incompleteSeedPromise: Promise<void> | null = null;

const getAliceSeed = () => {
  if (!aliceSeedPromise) {
    aliceSeedPromise = ensureAliceProfile().catch((e) => {
      console.warn('[e2e] Failed to seed Alice profile:', e);
    });
  }
  return aliceSeedPromise;
};

const getIncompleteSeed = () => {
  if (!incompleteSeedPromise) {
    incompleteSeedPromise = ensureIncompleteProfile().catch((e) => {
      console.warn('[e2e] Failed to clear incomplete profile:', e);
    });
  }
  return incompleteSeedPromise;
};

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const { hostname } = new URL(baseURL);

const setE2ECookie = async (page: Page, value: string) => {
  await page.context().addCookies([
    {
      name: E2E_AUTH_COOKIE_NAME,
      value,
      domain: hostname,
      path: '/',
    },
  ]);
};

/**
 * Custom test fixture that provides authenticated user functionality.
 * Uses a lightweight E2E cookie bypass instead of real Clerk auth.
 */
export const test = base.extend<{
  authenticatedPage: Page;
  incompleteProfilePage: Page;
  createTestUser: () => Promise<{ email: string; password: string; id: string }>;
}>({
  authenticatedPage: async ({ page }, providePage) => {
    await getAliceSeed();
    await setE2ECookie(page, E2E_AUTH_ALICE_COOKIE_VALUE);
    await providePage(page);
  },

  incompleteProfilePage: async ({ page }, providePage) => {
    await getIncompleteSeed();
    await setE2ECookie(page, E2E_AUTH_INCOMPLETE_COOKIE_VALUE);
    await providePage(page);
  },

  createTestUser: async () => {
    // Not used in current tests; kept for API compatibility
    return { email: 'test@example.com', password: 'TestPassword123!', id: 'e2e-test-user' };
  },
});

export { expect };
