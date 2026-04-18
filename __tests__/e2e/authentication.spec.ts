import type { Page, Route } from '@playwright/test';
import { test, expect } from './fixtures/test';

const fulfillJson = async (route: Route, status: number, body: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const visitAuthPage = async (page: Page, path: string) => {
  await page.route('**/api/auth/session', async (route) => {
    await fulfillJson(route, 200, { session: null });
  });

  const sessionResponse = page.waitForResponse((response) =>
    response.url().includes('/api/auth/session') && response.request().method() === 'GET'
  );

  await page.goto(path, { waitUntil: 'commit' });
  await page.waitForFunction(
    (expectedPath) => window.location.pathname === expectedPath,
    path,
    { timeout: 10000 }
  );
  await sessionResponse;
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

const expectDialogMessage = async (
  page: Page,
  action: () => Promise<void>,
  expectedMessage: string
) => {
  const dialogMessagePromise = new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();

      await dialog.accept();
      resolve(message);
    });
  });

  await action();

  await expect(dialogMessagePromise).resolves.toBe(expectedMessage);
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
      await page.route('**/api/auth/sign-in/email', async (route) => {
        await fulfillJson(route, 403, {
          message:
            'Please verify your email before signing in. Check your inbox and wait to verify the email.',
        });
      });

      const signInRequest = page.waitForRequest((request) =>
        request.url().includes('/api/auth/sign-in/email') && request.method() === 'POST'
      );

      await fillAndExpectValue(page, '#email', 'user@example.com');
      await fillAndExpectValue(page, '#password', 'Password123#');
      await page.getByRole('button', { name: /sign in/i }).click();

      await signInRequest;
      await page.waitForURL(/\/verify-email\/resend\?email=user%40example\.com/, {
        timeout: 10000,
      });
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
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
      await expectDialogMessage(
        page,
        async () => {
          await page.getByRole('button', { name: /sign up/i }).click({ noWaitAfter: true });
        },
        'Please fill in both fields'
      );
    });

    test('should show an alert for a weak password', async ({ page }) => {
      await fillAndExpectValue(page, '#email', 'test@example.com');
      await fillAndExpectValue(page, '#password', 'weak');

      await expectDialogMessage(
        page,
        async () => {
          await page.getByRole('button', { name: /sign up/i }).click({ noWaitAfter: true });
        },
        'Please ensure your password meets all the strength requirements.'
      );
    });

    test('should require terms agreement before signup', async ({ page }) => {
      await fillAndExpectValue(page, '#email', 'test@example.com');
      await fillAndExpectValue(page, '#password', 'StrongP@ssw0rd!');

      await expectDialogMessage(
        page,
        async () => {
          await page.getByRole('button', { name: /sign up/i }).click({ noWaitAfter: true });
        },
        'You must agree to the Terms of Service and Privacy Policy to create an account.'
      );
    });

    test('should submit successfully and return to login', async ({ page }) => {
      await page.route('**/api/auth/sign-up/email', async (route) => {
        await fulfillJson(route, 200, {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
          requiresEmailVerification: true,
        });
      });

      const signUpRequest = page.waitForRequest((request) =>
        request.url().includes('/api/auth/sign-up/email') && request.method() === 'POST'
      );

      await fillAndExpectValue(page, '#email', 'test@example.com');
      await fillAndExpectValue(page, '#password', 'StrongP@ssw0rd!');
      await page.locator('#agreed').check();

      await expectDialogMessage(
        page,
        async () => {
          await page.getByRole('button', { name: /sign up/i }).click({ noWaitAfter: true });
        },
        '🎉 Check your email for the confirmation link!'
      );

      await signUpRequest;
      await page.waitForURL(/.*\/login/, { timeout: 10000 });
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

    test('should submit successfully and return to login', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }

        await fulfillJson(route, 200, { success: true });
      });

      const resetRequest = page.waitForRequest((request) =>
        request.url().includes('/api/auth/reset-password') && request.method() === 'POST'
      );

      await fillAndExpectValue(page, '#email', 'user@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      await resetRequest;

      await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible();
      await expect(page.getByText("We've sent a password reset link to")).toBeVisible();
      await expect(page.getByText('user@example.com')).toBeVisible();

      await page.getByRole('button', { name: /back to sign in/i }).click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });
  });

  test.describe('Reset Password Page', () => {
    test('should show the forgot password form when the link is missing required params', async ({ page }) => {
      await page.goto('/reset-password');
      await expect(
        page.getByRole('heading', { name: /reset password/i })
      ).toBeVisible();
      await expect(page.getByLabel(/email address/i)).toBeVisible();
    });

    test('should validate mismatched passwords before submitting', async ({ page }) => {
      await page.goto('/reset-password?userId=user-123&secret=reset-secret');
      await fillResetPasswords(page, 'StrongP@ssw0rd!', 'DifferentP@ssw0rd!');
      await page.getByRole('button', { name: /update password/i }).click();

      await expect(page.getByText('Passwords do not match')).toBeVisible();
    });

    test('should update the password when the reset link is valid', async ({ page }) => {
      await page.route('**/api/auth/reset-password', async (route) => {
        if (route.request().method() !== 'PUT') {
          await route.continue();
          return;
        }

        await fulfillJson(route, 200, { success: true });
      });

      const updatePasswordRequest = page.waitForRequest((request) =>
        request.url().includes('/api/auth/reset-password') && request.method() === 'PUT'
      );

      await page.goto('/reset-password?userId=user-123&secret=reset-secret');
      await fillResetPasswords(page, 'StrongP@ssw0rd!', 'StrongP@ssw0rd!');
      await page.getByRole('button', { name: /update password/i }).click();

      await updatePasswordRequest;

      await expect(page.getByRole('heading', { name: /password updated!/i })).toBeVisible();
    });
  });
});
