import { expect, type Page } from '@playwright/test';

const isRedirectNavigationError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes('ERR_ABORTED') ||
    message.includes('frame was detached') ||
    message.includes('is interrupted by another navigation')
  );
};

const navigateWithRedirectTolerance = async (page: Page, path: string) => {
  try {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
  } catch (error) {
    if (!isRedirectNavigationError(error)) {
      throw error;
    }
  }
};

const waitForPathname = async (page: Page, prefix: string) => {
  await page.waitForFunction(
    (expectedPrefix) => window.location.pathname.startsWith(expectedPrefix),
    prefix,
    { timeout: 10000 }
  );
};

export const expectLoginRedirect = async (page: Page, path: string) => {
  await navigateWithRedirectTolerance(page, path);
  await waitForPathname(page, '/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
};

export const expectOnboardingRedirect = async (page: Page, path: string) => {
  await navigateWithRedirectTolerance(page, path);
  await waitForPathname(page, '/onboarding');
  await expect(page.getByRole('heading', { name: /welcome to skillogue/i })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('#first_name')).toBeVisible({ timeout: 10000 });
};

export const expectNotFoundPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
};
