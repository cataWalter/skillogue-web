import { test } from '@playwright/test';
import { expectLoginRedirect, expectNotFoundPage } from './utils/navigation';

test.describe('Admin', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing admin without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/admin');
    });
  });

  test.describe('Admin Page Structure', () => {
    test('should handle unauthenticated admin access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin');
    });
  });

  test.describe('Admin Verification', () => {
    test('should handle unauthenticated admin verification access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin/verification');
    });
  });

  test.describe('Admin Reports', () => {
    test('should handle unauthenticated admin reports access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin/reports');
    });
  });
});

test.describe('Error Pages', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    await expectNotFoundPage(page, '/this-page-does-not-exist-12345');
  });

  test('should handle unknown routes', async ({ page }) => {
    await expectNotFoundPage(page, '/another-fake-page');
  });
});

test.describe('Loading States', () => {
  test('should handle unauthenticated dashboard access', async ({ page }) => {
    await expectLoginRedirect(page, '/dashboard');
  });

  test('should handle unauthenticated messages access', async ({ page }) => {
    await expectLoginRedirect(page, '/messages');
  });

  test('should handle unauthenticated profile access', async ({ page }) => {
    await expectLoginRedirect(page, '/profile');
  });
});
