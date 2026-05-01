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

  test('should show Get Started and Browse Profiles buttons', async ({ page }) => {
    await page.goto('/');
    
    // Check for Get Started button (links to login)
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
    
    // Check for Browse Profiles button
    await expect(page.getByRole('link', { name: /browse profiles/i })).toBeVisible();
  });

  test('should navigate to login page via Get Started', async ({ page }) => {
    await page.goto('/');
    
    // Click on Get Started link
    await page.getByRole('link', { name: /get started/i }).click();
    
    // Should navigate to login page
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should navigate to search page via Browse Profiles', async ({ page }) => {
    await page.goto('/');
    
    // Click on Browse Profiles link
    await page.getByRole('link', { name: /browse profiles/i }).click();
    
    // Should navigate to login page (search requires authentication)
    await expect(page).toHaveURL(/.*\/login/);
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
