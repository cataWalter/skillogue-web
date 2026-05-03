import { test, expect } from './fixtures/auth';
import { expectLoginRedirect, expectOnboardingRedirect } from './utils/navigation';

test.describe('Dashboard', () => {
  test.describe('Unauthenticated Access', () => {
    test('should handle unauthenticated dashboard access', async ({ page }) => {
      await expectLoginRedirect(page, '/dashboard');
    });

    test('should handle unauthenticated search access', async ({ page }) => {
      await expectLoginRedirect(page, '/search');
    });
  });

  test.describe('Incomplete Profile Access', () => {
    test('should redirect incomplete profiles from dashboard to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/dashboard');
    });

    test('should redirect incomplete profiles from search to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/search');
    });
  });

  test.describe('Dashboard - Authenticated', () => {
    test('should show a personalised welcome heading', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');

      await expect(
        authenticatedPage.getByRole('heading', { name: /welcome back,/i, level: 1 })
      ).toBeVisible({ timeout: 15000 });
    });

    test('should have a Discover link on the dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');

      await expect(authenticatedPage.getByRole('link', { name: /^discover$/i })).toBeVisible({ timeout: 15000 });
    });

    test('should have a Messages link on the dashboard', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');

      await expect(authenticatedPage.getByRole('link', { name: /^messages$/i }).first()).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to search when clicking Discover', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard');
      await authenticatedPage.getByRole('link', { name: /^discover$/i }).click();

      await expect(authenticatedPage).toHaveURL(/\/search/, { timeout: 10000 });
    });
  });
});

test.describe('Search Functionality', () => {
  test('should handle unauthenticated search access', async ({ page }) => {
    await expectLoginRedirect(page, '/search');
  });

  test('should funnel incomplete profiles from search into onboarding', async ({ incompleteProfilePage }) => {
    await expectOnboardingRedirect(incompleteProfilePage, '/search');
  });

  test.describe('Search - Authenticated', () => {
    test('should show the Discover People heading', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/search');

      await expect(authenticatedPage.getByRole('heading', { name: /discover people/i, level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('should have keyword search input', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/search');

      await expect(authenticatedPage.getByPlaceholder(/search by name or bio/i)).toBeVisible({ timeout: 15000 });
    });

    test('should have location filter input', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/search');

      await expect(authenticatedPage.getByPlaceholder(/city, country/i)).toBeVisible({ timeout: 15000 });
    });
  });
});

test.describe('Navbar Navigation', () => {
  test('should display navbar on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
  });
});
