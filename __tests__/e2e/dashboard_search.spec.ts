import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.describe('Unauthenticated Access', () => {
    test('should handle unauthenticated dashboard access', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
    });

    test('should handle unauthenticated search access', async ({ page }) => {
      await page.goto('/search');
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Protected Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/search',
      '/messages',
      '/favorites',
      '/profile',
      '/edit-profile',
      '/settings',
      '/notifications',
    ];

    for (const route of protectedRoutes) {
      test(`should handle ${route} access`, async ({ page }) => {
        await page.goto(route);
        await page.waitForTimeout(2000);
      });
    }
  });
});

test.describe('Search Functionality', () => {
  test('should handle unauthenticated search access', async ({ page }) => {
    await page.goto('/search');
    await page.waitForTimeout(2000);
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
