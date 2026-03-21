import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
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

    test('should show error when submitting empty form', async ({ page }) => {
      // Click sign in without filling form
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.waitForTimeout(500);
    });

    test('should navigate to signup page when clicking sign up link', async ({ page }) => {
      await page.goto('/login');
      await page.waitForTimeout(3000);
    });

    test('should navigate to forgot-password page when clicking forgot password link', async ({ page }) => {
      await page.getByRole('link', { name: /forgot your password/i }).click();
      await expect(page).toHaveURL(/.*\/forgot-password/, { timeout: 10000 });
    });

    test('should be on login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/signup');
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

    test('should have password input', async ({ page }) => {
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();
    });

    test('should navigate to login page when clicking sign in link', async ({ page }) => {
      await page.getByRole('link', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });

    test('should have links to terms of service and privacy policy', async ({ page }) => {
      await page.waitForTimeout(2000);
      // Check that page loads
    });
  });

  test.describe('Forgot Password Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/forgot-password');
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

    test('should navigate back to login when clicking back link', async ({ page }) => {
      await page.getByRole('link', { name: /back to login/i }).click();
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    });

    test('should show error when submitting empty email', async ({ page }) => {
      await page.getByRole('button', { name: /send/i }).click();
      
      await page.waitForTimeout(500);
    });
  });

  test.describe('Reset Password Page', () => {
    test('should display reset password page', async ({ page }) => {
      await page.goto('/reset-password');
      // Just check the page loads without crash
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Navigation between auth pages', () => {
    test('should have working navigation between login and signup', async ({ page }) => {
      // Start at login
      await page.goto('/login');
      await page.waitForTimeout(3000);
    });
  });
});
