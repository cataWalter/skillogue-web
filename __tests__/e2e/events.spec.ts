import { test, expect } from './fixtures/auth';
import { expectLoginRedirect } from './utils/navigation';

test.describe('Events', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing events without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/events');
    });

    test('should redirect to login when accessing event detail without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/events/event-1');
    });
  });

  test.describe('Authenticated Pages', () => {
    test('should render the events discovery page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/events');

      await expect(authenticatedPage.getByRole('heading', { name: /discover events/i })).toBeVisible();
      await expect(authenticatedPage.getByText(/published events found/i)).toBeVisible();
    });

    test('should render the events calendar page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/calendar');

      await expect(authenticatedPage.getByRole('heading', { name: /calendar/i })).toBeVisible();
      await expect(authenticatedPage.getByText(/events on this day/i)).toBeVisible();
    });

    test('should render the dashboard events page', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/dashboard/events');

      await expect(authenticatedPage.getByRole('heading', { name: /your events/i })).toBeVisible();
      await expect(authenticatedPage.getByRole('button', { name: /create event/i })).toBeVisible();
    });
  });
});