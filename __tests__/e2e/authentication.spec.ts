import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';
import {
  E2E_UNVERIFIED_EMAIL,
  E2E_SIGNUP_SUCCESS_EMAIL,
  E2E_RESET_PASSWORD_EMAIL,
} from '../../src/lib/e2e-auth';

const visitAuthPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (expectedPath) => window.location.pathname === expectedPath,
    path,
    { timeout: 10000 }
  );
};

const fillAndExpectValue = async (page: Page, selector: string, value: string) => {
  const locator = page.locator(selector);

  await locator.fill(value);
  await expect(locator).toHaveValue(value);
};

const fillResetPasswords = async (page: Page, password: string, confirmPassword: string) => {
  const newPasswordInput = page.locator('#new-password');
  const confirmPasswordInput = page.locator('#confirm-password');

  await newPasswordInput.fill(password);
  await expect(newPasswordInput).toHaveValue(password);

  await confirmPasswordInput.fill(confirmPassword);
  await expect(confirmPasswordInput).toHaveValue(confirmPassword);

  if ((await newPasswordInput.inputValue()) !== password) {
    await newPasswordInput.fill(password);
  }

  if ((await confirmPasswordInput.inputValue()) !== confirmPassword) {
    await confirmPasswordInput.fill(confirmPassword);
  }

  await expect(newPasswordInput).toHaveValue(password);
  await expect(confirmPasswordInput).toHaveValue(confirmPassword);
};

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await visitAuthPage(page, '/login');
    });

    test('should display login form with all required elements', async ({ page }) => {
      // Check for heading
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });

      // Check for email input
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    });

    test('should show a toast when submitting an empty form', async ({ page }) => {
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText('Please fill in both fields')).toBeVisible();
    });

    test('should navigate to forgot-password page when clicking forgot password link', async ({ page }) => {
      await page.getByRole('link', { name: /forgot your password/i }).click();
      await expect(page).toHaveURL(/.*\/forgot-password/, { timeout: 10000 });
    });

    test('should redirect unverified users to the resend verification page', async ({ page }) => {
      // AuthContext short-circuits for E2E_UNVERIFIED_EMAIL on localhost and throws
      // "Please verify your email before signing in" without making a real Clerk API call.
      // The login page checks for that fragment and redirects to /verify-email/resend.
      await fillAndExpectValue(page, '#email', E2E_UNVERIFIED_EMAIL);
      await fillAndExpectValue(page, '#password', 'Password123#');
      await page.getByRole('button', { name: /sign in/i }).click();

      await page.waitForURL(
        new RegExp(`/verify-email/resend\\?email=${encodeURIComponent(E2E_UNVERIFIED_EMAIL).replace(/\+/g, '%2B')}`),
        { timeout: 10000 },
      );
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      // Block Cloudflare Turnstile so Clerk's CAPTCHA form-interceptor never installs.
      // Without this, Clerk's SDK may capture the form's native `submit` event before
      // React's onSubmit handler runs, making client-side validation tests flaky.
      await page.route('**/challenges.cloudflare.com/**', (route) => route.abort());
      await visitAuthPage(page, '/signup');
    });

    test('should display signup form with all required elements', async ({ page }) => {
      // Check for heading
      await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible({ timeout: 10000 });

      // Check for email input
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();

      // Check for password input
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();

      // Check for submit button
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible();
    });

    test('should navigate to login page when clicking sign in link', async ({ page }) => {
      await page.getByRole('main').getByRole('link', { name: /^sign in$/i }).click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });

    test('should show an alert when fields are empty', async ({ page }) => {
      await page.getByRole('button', { name: /sign up/i }).click();
      await expect(page.getByText('Please fill in both fields')).toBeVisible({ timeout: 5000 });
    });

    test('should show an alert for a weak password', async ({ page }) => {
      // Client-side validation runs before any Clerk call; no network mocking needed.
      await fillAndExpectValue(page, '#email', 'test@example.com');
      await fillAndExpectValue(page, '#password', 'weak');
      await expect(page.getByRole('button', { name: /sign up/i })).toBeEnabled();
      await page.getByRole('button', { name: /sign up/i }).click();
      await expect(
        page.getByText('Please ensure your password meets all the strength requirements.')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should require terms agreement before signup', async ({ page }) => {
      await fillAndExpectValue(page, '#email', 'test@example.com');
      await fillAndExpectValue(page, '#password', 'StrongP@ssw0rd!');
      await page.getByRole('button', { name: /sign up/i }).click();
      await expect(
        page.getByText(
          'You must agree to the Terms of Service and Privacy Policy to create an account.'
        )
      ).toBeVisible({ timeout: 5000 });
    });

    test('should submit successfully and navigate to email verification', async ({ page }) => {
      // AuthContext short-circuits for E2E_SIGNUP_SUCCESS_EMAIL on localhost and returns
      // { requiresEmailVerification: true } without making a real Clerk API call.
      await fillAndExpectValue(page, '#email', E2E_SIGNUP_SUCCESS_EMAIL);
      await fillAndExpectValue(page, '#password', 'StrongP@ssw0rd!');
      await page.locator('#agreed').check();
      await page.getByRole('button', { name: /sign up/i }).click();

      await page.waitForURL(/\/verify-email/, { timeout: 10000 });
    });

    test('should expose terms and privacy links', async ({ page }) => {
      await expect(
        page.getByRole('main').getByRole('link', { name: /terms of service/i })
      ).toHaveAttribute(
        'href',
        '/terms-of-service'
      );
      await expect(
        page.getByRole('main').getByRole('link', { name: /privacy policy/i })
      ).toHaveAttribute(
        'href',
        '/privacy-policy'
      );
    });
  });

  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await visitAuthPage(page, '/forgot-password');
    });

    test('should display forgot password form with all required elements', async ({ page }) => {
      // Check for heading
      await expect(page.getByRole('heading', { name: /reset/i })).toBeVisible({ timeout: 10000 });

      // Check for email input
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();

      // Check for submit button
      await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    });

    test('should submit successfully and show the confirmation screen', async ({ page }) => {
      // AuthContext short-circuits for E2E_RESET_PASSWORD_EMAIL on localhost and
      // returns without throwing, so the forgot-password page shows its confirmation screen.
      await fillAndExpectValue(page, '#email', E2E_RESET_PASSWORD_EMAIL);
      await page.getByRole('button', { name: /send reset link/i }).click();

      await expect(
        page.getByRole('heading', { name: /check your email/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("We've sent a password reset link to")).toBeVisible();
      await expect(page.getByText(E2E_RESET_PASSWORD_EMAIL)).toBeVisible();

      await page.getByRole('button', { name: /back to sign in/i }).click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });
  });

  test.describe('Reset Password Page', () => {
    test('should show the reset password form', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(
        page.getByRole('heading', { name: /set new password/i })
      ).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#reset-code')).toBeVisible();
      await expect(page.locator('#new-password')).toBeVisible();
      await expect(page.locator('#confirm-password')).toBeVisible();
    });

    test('should validate mismatched passwords before submitting', async ({ page }) => {
      await page.goto('/reset-password');
      await page.locator('#reset-code').fill('123456');
      await fillResetPasswords(page, 'StrongP@ssw0rd!', 'DifferentP@ssw0rd!');
      await page.getByRole('button', { name: /update password/i }).click();

      await expect(page.getByText('Passwords do not match')).toBeVisible();
    });

    test('should show an error when all fields are empty on submit', async ({ page }) => {
      await page.goto('/reset-password');
      await page.getByRole('button', { name: /update password/i }).click();

      await expect(page.getByText('Please fill in all fields')).toBeVisible();
    });
  });
});
