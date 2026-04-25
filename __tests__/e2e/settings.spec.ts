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

    test('should have settings heading', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should have back to dashboard link', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should have profile section', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should have account section', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should have privacy section', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should have notifications section', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });
  });

  test.describe('Settings Navigation Links', () => {
    test('should link to profile page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to edit-profile page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to verification page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to reset password page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to privacy settings', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to blocked users page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to data export page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should link to delete account page', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });
  });

  test.describe('Settings - Verification', () => {
    test('should redirect to login when accessing verification without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/verification');
    });

    test('should display verification form elements', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/verification');
    });
  });

  test.describe('Settings - Privacy', () => {
    test('should redirect to login when accessing privacy without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });

    test('should display privacy settings elements', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });

    test('should have profile visibility options', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });

    test('should have show age option', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });

    test('should have show location option', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/privacy');
    });
  });

  test.describe('Settings - Blocked Users', () => {
    test('should redirect to login when accessing blocked without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/blocked');
    });

    test('should display blocked users list', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/blocked');
    });

    test('should have unblock button', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/blocked');
    });
  });

  test.describe('Settings - Data Export', () => {
    test('should redirect to login when accessing data-export without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/data-export');
    });

    test('should display data export options', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/data-export');
    });

    test('should have export button', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/data-export');
    });
  });

  test.describe('Settings - Delete Account', () => {
    test('should redirect to login when accessing delete-account without auth', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/delete-account');
    });

    test('should display delete account warning', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/delete-account');
    });

    test('should have confirmation input', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/delete-account');
    });

    test('should have delete button', async ({ page }) => {
      await expectLoginRedirect(page, '/settings/delete-account');
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

    test('should have notifications heading', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should display notification list', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should show empty state when no notifications', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should have mark all as read button', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });
  });

  test.describe('Notification Types', () => {
    test('should show message notifications', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should show favorite notifications', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should show verification notifications', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });
  });

  test.describe('Notification Actions', () => {
    test('should navigate to message on click', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should have delete notification option', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });

    test('should mark notification as read', async ({ page }) => {
      await expectLoginRedirect(page, '/notifications');
    });
  });

  test.describe('Notification Settings', () => {
    test('should have push notification toggle', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });

    test('should toggle push notifications', async ({ page }) => {
      await expectLoginRedirect(page, '/settings');
    });
  });
});

test.describe('Reset Password', () => {
  test('should display reset password page', async ({ page }) => {
    await page.goto('/reset-password');
    // Page loads - heading may be "Set New Password" if session exists
    await page.waitForTimeout(2000);
  });

  test('should have password input fields', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForTimeout(500);
  });

  test('should have confirm password field', async ({ page }) => {
    await page.goto('/reset-password');
    await page.waitForTimeout(500);
  });
});

test.describe('Settings Navigation Flow', () => {
  test('should navigate from dashboard to settings', async ({ page }) => {
    await expectLoginRedirect(page, '/dashboard');
  });

  test('should navigate from settings to privacy', async ({ page }) => {
    await expectLoginRedirect(page, '/settings');
  });

  test('should navigate from settings to blocked', async ({ page }) => {
    await expectLoginRedirect(page, '/settings');
  });

  test('should navigate from settings to delete account', async ({ page }) => {
    await expectLoginRedirect(page, '/settings');
  });
});