import { test, expect } from './fixtures/auth';
import { expectLoginRedirect, expectOnboardingRedirect } from './utils/navigation';

test.describe('Messages', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing messages without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/messages');
    });

    test('should redirect to login when accessing messages with conversation param', async ({ page }) => {
      await expectLoginRedirect(page, '/messages?conversation=test-conversation-id');
    });
  });

  test.describe('Incomplete Profile Access', () => {
    test('should redirect incomplete profiles from messages to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/messages');
    });

    test('should redirect incomplete profiles from conversation URLs to onboarding', async ({ incompleteProfilePage }) => {
      await expectOnboardingRedirect(incompleteProfilePage, '/messages?conversation=test-conversation-id');
    });
  });

  test.describe('Messages Page - Authenticated', () => {
    test('should load the messages page when authenticated', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/messages');

      await expect(authenticatedPage.getByRole('heading', { name: /^messages$/i })).toBeVisible({ timeout: 15000 });
    });

    test('should show the empty state title when there are no conversations', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/messages');

      await expect(
        authenticatedPage.getByText(/no conversations yet/i).first()
      ).toBeVisible({ timeout: 15000 });
    });

    test('should have a Find People link in the empty conversations state', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/messages');

      await expect(authenticatedPage.getByRole('link', { name: /find people/i })).toBeVisible({ timeout: 15000 });
    });

    test('should show the conversation selection prompt when no chat is selected', async ({ authenticatedPage }, testInfo) => {
      test.skip(testInfo.project.name.toLowerCase().includes('mobile'), 'Selection prompt panel is hidden on mobile viewports (hidden md:flex)');

      await authenticatedPage.goto('/messages');

      await expect(
        authenticatedPage.getByText(/select a conversation to start chatting/i)
      ).toBeVisible({ timeout: 15000 });
    });
  });
});
