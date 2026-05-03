import { test, expect } from './fixtures/auth';
import { expectLoginRedirect, expectOnboardingRedirect } from './utils/navigation';

test.describe('Favorites', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing favorites without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/favorites');
    });
  });

  test.describe('Incomplete Profile Access', () => {
    test('should redirect incomplete profiles from favorites to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/favorites');
    });
  });

  test.describe('Favorites Page - Authenticated', () => {
    test('should display the favorites heading when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/favorites');

      await expect(authenticatedPage.getByRole('heading', { name: /favorite profiles/i, level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('should show the empty state when the user has no favorites', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/favorites');

      await expect(authenticatedPage.getByText(/you haven't saved any profiles yet/i)).toBeVisible({ timeout: 15000 });
    });

    test('should have a Find People link in the empty state', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/favorites');

      await expect(authenticatedPage.getByRole('link', { name: /find people/i })).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to search from the empty state Find People link', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/favorites');

      await authenticatedPage.getByRole('link', { name: /find people/i }).click();
      await expect(authenticatedPage).toHaveURL(/\/search/, { timeout: 10000 });
    });
  });
});
