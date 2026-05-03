import { test, expect } from './fixtures/auth';
import { expectLoginRedirect } from './utils/navigation';

test.describe('Profile Pages', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/profile');
    });

    test('should redirect to login when accessing edit-profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/edit-profile');
    });

    test('should redirect to login when accessing user profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/user/some-user-id');
    });
  });

  test.describe('Profile Page - Authenticated', () => {
    test('should display the authenticated user profile', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');

      // Alice's profile has first_name "Alice" and last_name "Johnson"; the page renders an h1
      await expect(authenticatedPage.getByRole('heading', { name: /alice/i, level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('should have an edit profile button', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');

      await expect(authenticatedPage.getByRole('link', { name: /edit profile/i })).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to edit-profile when clicking Edit Profile', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      await authenticatedPage.getByRole('link', { name: /edit profile/i }).click();

      await expect(authenticatedPage).toHaveURL(/\/edit-profile/, { timeout: 10000 });
    });
  });

  test.describe('Edit Profile - Authenticated', () => {
    test('should display the edit profile form', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/edit-profile');

      await expect(authenticatedPage.getByRole('main')).toBeVisible({ timeout: 15000 });
    });
  });
});

test.describe('Onboarding', () => {
  test('should redirect to login when accessing onboarding without authentication', async ({ page }) => {
    await expectLoginRedirect(page, '/onboarding');
  });
});

test.describe('Static Pages', () => {
  test.describe('Contact Page', () => {
    test('should display contact page', async ({ page }) => {
      await page.goto('/contact');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Privacy Policy Page', () => {
    test('should display privacy policy page', async ({ page }) => {
      await page.goto('/privacy-policy');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have privacy policy content', async ({ page }) => {
      await page.goto('/privacy-policy');

      await expect(page.locator('h1').getByText(/privacy/i)).toBeVisible();
    });
  });

  test.describe('Terms of Service Page', () => {
    test('should display terms of service page', async ({ page }) => {
      await page.goto('/terms-of-service');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have terms of service content', async ({ page }) => {
      await page.goto('/terms-of-service');

      await expect(page.locator('h1').getByText(/terms/i)).toBeVisible();
    });
  });

  test.describe('FAQ Page', () => {
    test('should display the FAQ page', async ({ page }) => {
      await page.goto('/faq');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Cookies Policy Page', () => {
    test('should display the cookies page', async ({ page }) => {
      await page.goto('/cookies');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });
});
