import { expect, type Page } from '@playwright/test';

export const expectLoginRedirect = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/.*\/login(?:\?.*)?$/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
};

export const expectNotFoundPage = async (page: Page, path: string) => {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
};