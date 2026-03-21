import { test as base, Page } from '@playwright/test';
import { appClient } from '../../../src/lib/appClient';

/**
 * Custom test fixture that provides authenticated user functionality
 */
export const test = base.extend<{
  authenticatedPage: Page;
  createTestUser: () => Promise<{ email: string; password: string; id: string }>;
}>({
  authenticatedPage: async ({ page }, providePage) => {
    // Sign in with test user credentials
    const testEmail = 'testuser@example.com';
    const testPassword = 'TestPassword123!';
    
    try {
      const { error } = await appClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        console.log('Auth error (may need test user setup):', error.message);
        // Continue without auth - tests will handle redirect
      }

      // Navigate to the page
      await page.goto('/');
      
      // Wait a bit for any auth state changes
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('Could not authenticate:', e);
    }

    await providePage(page);
  },

  createTestUser: async () => {
    // Create a test user in Appwrite
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      const { data, error } = await appClient.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        console.log('User creation error:', error.message);
        throw error;
      }

      return {
        email: testEmail,
        password: testPassword,
        id: data.user?.id || '',
      };
    } catch (e) {
      console.log('Error creating test user:', e);
      throw e;
    }
  },
});

export { expect } from '@playwright/test';
