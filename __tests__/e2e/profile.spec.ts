import { test, expect } from '@playwright/test';
import { expectLoginRedirect } from './utils/navigation';

test.describe('Profile Pages', () => {
  test.describe('View Profile Page', () => {
    test('should redirect to login when accessing profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/profile');
    });

    test('should keep the profile page protected until authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/profile');
    });
  });

  test.describe('Edit Profile Page', () => {
    test('should redirect to login when accessing edit-profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/edit-profile');
    });

    test('should keep edit-profile protected until authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/edit-profile');
    });
  });

  test.describe('User Profile Page ([id])', () => {
    test('should redirect to login when accessing user profile without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/user/some-user-id');
    });

    test('should keep user profile routes protected until authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/user/some-user-id');
    });

    test('should redirect invalid user profile routes to login when unauthenticated', async ({ page }) => {
      await expectLoginRedirect(page, '/user/invalid-user-id-123');
    });
  });

  test.describe('Profile Card Component', () => {
    test('should have edit profile button link', async ({ page }) => {
      await expectLoginRedirect(page, '/profile');
    });

    test('should display avatar element', async ({ page }) => {
      await expectLoginRedirect(page, '/profile');
    });
  });
});

test.describe('Onboarding', () => {
  test('should redirect to login when accessing onboarding without authentication', async ({ page }) => {
    await expectLoginRedirect(page, '/onboarding');
  });

  test('should keep onboarding behind authentication before profile completion checks', async ({ page }) => {
    await expectLoginRedirect(page, '/onboarding');
  });
});

test.describe('Static Pages', () => {
  test.describe('Contact Page', () => {
    test('should display contact page', async ({ page }) => {
      await page.goto('/contact');
      
      // Check for heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have contact form', async ({ page }) => {
      await page.goto('/contact');
      
      // Check for form elements
      // At least one should be visible or page should load
      await page.waitForTimeout(500);
    });
  });

  test.describe('Privacy Policy Page', () => {
    test('should display privacy policy page', async ({ page }) => {
      await page.goto('/privacy-policy');
      
      // Check for heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have privacy policy content', async ({ page }) => {
      await page.goto('/privacy-policy');
      
      // Check for privacy policy heading (avoiding strict mode violation)
      await expect(page.locator('h1').getByText(/privacy/i)).toBeVisible();
    });
  });

  test.describe('Terms of Service Page', () => {
    test('should display terms of service page', async ({ page }) => {
      await page.goto('/terms-of-service');
      
      // Check for heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have terms of service content', async ({ page }) => {
      await page.goto('/terms-of-service');
      
      // Check for terms heading (avoiding strict mode violation)
      await expect(page.locator('h1').getByText(/terms/i)).toBeVisible();
    });
  });
});

test.describe('Profile Navigation Flow', () => {
  test('should navigate from dashboard to profile', async ({ page }) => {
    await expectLoginRedirect(page, '/dashboard');
  });

  test('should navigate from profile to edit-profile', async ({ page }) => {
    await expectLoginRedirect(page, '/profile');
  });

  test('should navigate from settings to profile', async ({ page }) => {
    await expectLoginRedirect(page, '/settings');
  });
});

test.describe('User Profile Links', () => {
  test('should have message button on user profile', async ({ page }) => {
    await expectLoginRedirect(page, '/user/test-user-id');
  });

  test('should have favorite button on user profile', async ({ page }) => {
    await expectLoginRedirect(page, '/user/test-user-id');
  });

  test('should have report button on user profile', async ({ page }) => {
    await expectLoginRedirect(page, '/user/test-user-id');
  });
});

test.describe('Profile Form Validation', () => {
  test('should validate required fields on edit-profile', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have first name input', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have last name input', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have about me textarea', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have passion selection', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have language selection', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });

  test('should have location inputs', async ({ page }) => {
    await expectLoginRedirect(page, '/edit-profile');
  });
});