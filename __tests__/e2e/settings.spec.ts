import { test, expect } from './fixtures/auth';
import { expectLoginRedirect, expectOnboardingRedirect } from './utils/navigation';

test.describe('Settings', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing settings without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });
  });

  test.describe('Incomplete Profile Access', () => {
    test('should redirect incomplete profiles from settings to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/settings');
    });
  });

  test.describe('Main Settings Page', () => {
    test('should keep settings protected until authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should render the settings hub when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');

      await expect(authenticatedPage.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 15000 });
    });

    test('should have back to dashboard link', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');

      await expect(authenticatedPage.getByRole('link', { name: /back to dashboard/i })).toBeVisible({ timeout: 15000 });
    });

    test('should render the theme toggle after login', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');

      await expect(authenticatedPage.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeVisible();
    });
  });

  test.describe('Settings Navigation Links', () => {
    test('should have navigation links to all settings sub-pages', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings');

      // Use href selectors to avoid strict-mode ambiguity from other links on the page
      await expect(authenticatedPage.locator('a[href="/settings/verification"]').first()).toBeVisible({ timeout: 15000 });
      await expect(authenticatedPage.locator('a[href="/settings/privacy"]').first()).toBeVisible();
      await expect(authenticatedPage.locator('a[href="/settings/blocked"]').first()).toBeVisible();
      await expect(authenticatedPage.locator('a[href="/settings/data-export"]').first()).toBeVisible();
      await expect(authenticatedPage.locator('a[href="/settings/delete-account"]').first()).toBeVisible();
    });
  });

  test.describe('Settings - Verification', () => {
    test('should redirect to login when accessing verification without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/verification');
    });

    test('should reach the verification page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/verification');

      await expect(authenticatedPage.getByRole('heading', { name: /profile verification/i, level: 1 })).toBeVisible();
      await expect(authenticatedPage.getByRole('link', { name: /back to settings/i })).toBeVisible();
    });
  });

  test.describe('Settings - Privacy', () => {
    test('should redirect to login when accessing privacy without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });

    test('should reach the privacy page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/privacy');

      await expect(authenticatedPage.getByRole('heading', { name: /privacy settings/i, level: 1 })).toBeVisible();
      await expect(authenticatedPage.getByRole('checkbox', { name: /private profile/i })).toBeVisible();
    });
  });

  test.describe('Settings - Blocked Users', () => {
    test('should redirect to login when accessing blocked without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/blocked');
    });

    test('should reach the blocked users page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/blocked');

      await expect(authenticatedPage.getByRole('heading', { name: /blocked users/i, level: 1 })).toBeVisible({ timeout: 15000 });
      await expect(authenticatedPage.getByRole('link', { name: /back to settings/i })).toBeVisible();
    });

    test('should show the empty state when no users are blocked', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/blocked');

      await expect(authenticatedPage.getByText(/no blocked users/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Settings - Data Export', () => {
    test('should redirect to login when accessing data-export without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/data-export');
    });

    test('should reach the export page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/data-export');

      await expect(authenticatedPage.getByRole('heading', { name: /export your data/i, level: 1 })).toBeVisible();
      await expect(authenticatedPage.getByRole('button', { name: /download my data/i })).toBeVisible();
    });
  });

  test.describe('Settings - Delete Account', () => {
    test('should redirect to login when accessing delete-account without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/delete-account');
    });

    test('should reach the delete account page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/settings/delete-account');

      await expect(authenticatedPage.getByRole('heading', { name: /delete account/i, level: 1 })).toBeVisible();
      await expect(authenticatedPage.getByRole('button', { name: /permanently delete account/i })).toBeVisible();
    });
  });
});

test.describe('Notifications', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing notifications without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });
  });

  test.describe('Incomplete Profile Access', () => {
    test('should redirect incomplete profiles from notifications to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/notifications');
    });
  });

  test.describe('Notifications Page', () => {
    test('should keep notifications protected until authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should display the notifications heading when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/notifications');

      await expect(authenticatedPage.getByRole('heading', { name: /^notifications$/i, level: 1 })).toBeVisible({ timeout: 15000 });
    });

    test('should show the empty state when there are no notifications', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/notifications');

      await expect(authenticatedPage.getByText(/no notifications yet/i)).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Notification Settings', () => {
    test('should render unsupported push copy when the test override disables support', async ({ authenticatedPage }) => {
      await authenticatedPage.addInitScript(() => {
        (window as Window & {
          __SKILLOGUE_PUSH_SUPPORT_OVERRIDE__?: 'supported' | 'unsupported';
        }).__SKILLOGUE_PUSH_SUPPORT_OVERRIDE__ = 'unsupported';
      });

      await authenticatedPage.goto('/settings');

      await expect(authenticatedPage.getByText(/notifications unavailable on this device/i)).toBeVisible();
      await expect(authenticatedPage.getByText(/try a supported browser or device if you want message alerts outside the app/i)).toBeVisible();
      await expect(authenticatedPage.getByRole('button', { name: /^Enable$/i })).toHaveCount(0);
    });
  });
});
test.describe('Change Password', () => {
  test('should display the change password form', async ({ page }) => {
    await page.goto('/change-password');

    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#current-password')).toBeVisible();
    await expect(page.locator('#new-password')).toBeVisible();
    await expect(page.locator('#confirm-password')).toBeVisible();
  });

  test('should reject mismatched passwords', async ({ page }) => {
    await page.goto('/change-password');

    await page.locator('#current-password').fill('OldPassword1!');
    await page.locator('#new-password').fill('NewPassword1!');
    await page.locator('#confirm-password').fill('DifferentPassword1!');
    await page.getByRole('button', { name: /update password/i }).click();

    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Settings Navigation Flow', () => {
  test('should navigate to settings hub from dashboard link', async ({ authenticatedPage }, testInfo) => {
    await authenticatedPage.goto('/dashboard');

    if (testInfo.project.name.toLowerCase().includes('mobile')) {
      // On mobile, nav links are behind a hamburger menu
      await authenticatedPage.getByRole('button', { name: /open navigation menu/i }).click();
      await authenticatedPage.getByRole('link', { name: /^settings$/i }).click();
    } else {
      const settingsLink = authenticatedPage.getByRole('link', { name: /settings/i }).first();
      await settingsLink.click();
    }

    await expect(authenticatedPage).toHaveURL(/\/settings/, { timeout: 10000 });
  });
});
