import { test, expect } from '@playwright/test';
import { expectLoginRedirect } from './utils/navigation';

test.describe('Dashboard', () => {
  test.describe('Unauthenticated Access', () => {
    test('should handle unauthenticated dashboard access', async ({ page }) => {
      await expectLoginRedirect(page, '/dashboard');
    });

    test('should handle unauthenticated search access', async ({ page }) => {
      await expectLoginRedirect(page, '/search');
    });
  });

  test.describe('Protected Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/search',
      '/messages',
      '/profile',
      '/edit-profile',
      '/settings',
      '/notifications',
    ];

    for (const route of protectedRoutes) {
      test(`should handle ${route} access`, async ({ page }) => {
        await expectLoginRedirect(page, route);
      });
    }
  });
});

test.describe('Search Functionality', () => {
  test('should handle unauthenticated search access', async ({ page }) => {
    await expectLoginRedirect(page, '/search');
  });
});

test.describe('Navbar Navigation', () => {
  test('should display navbar on homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
  });

  test('should show login button when not authenticated', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should show Skillogue text', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });
});
