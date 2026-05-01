import { test, expect } from './fixtures/test';

test.describe('Homepage', () => {
  test('should load the homepage without errors', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that the main heading is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show primary and secondary CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check for Create Free Profile button (links to signup)
    await expect(page.getByRole('link', { name: /create free profile/i })).toBeVisible();
    
    // Check for FAQ link
    await expect(page.getByRole('link', { name: /faq/i })).toBeVisible();
  });

  test('should navigate to signup page via Create Free Profile', async ({ page }) => {
    await page.goto('/');
    
    // Click on Create Free Profile link
    await page.getByRole('link', { name: /create free profile/i }).click();
    
    // Should navigate to signup page
    await expect(page).toHaveURL(/.*\/signup/);
  });

  test('should navigate to FAQ page via FAQ link', async ({ page }) => {
    await page.goto('/');
    
    // Click on FAQ link
    await page.getByRole('link', { name: /^faq$/i }).first().click();
    
    // Should navigate to FAQ page
    await expect(page).toHaveURL(/.*\/faq/);
  });
});

test.describe('Navigation', () => {
  test('should have working navigation bar', async ({ page }) => {
    await page.goto('/');
    
    // Check navbar exists
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
  });
});
