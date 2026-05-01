import { expect, test } from './fixtures/test';
import {
  E2E_AUTH_ADMIN_COOKIE_VALUE,
  E2E_AUTH_COOKIE_NAME,
  E2E_AUTH_HEADER_NAME,
} from '../../src/lib/e2e-auth';
import { expectLoginRedirect, expectNotFoundPage } from './utils/navigation';

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const adminSessionPayload = {
  session: {
    user: {
      id: 'e2e-admin',
      email: 'cata.walter@gmail.com',
      name: 'E2E Admin',
    },
    expires: '2099-01-01T00:00:00.000Z',
  },
};

const baseDashboardPayload = {
  analytics: {
    range: {
      days: 30,
      label: 'Last 30 days',
      trendWindowDays: 30,
    },
    filters: {
      eventType: null,
      path: null,
      availableEventTypes: ['search_submitted', 'message_sent'],
      availablePaths: ['/search', '/messages'],
      exportUrl: '/api/admin/analytics?days=30&export=json',
    },
    overview: {
      totalEvents: 42,
      pageViews: 18,
      uniquePaths: 6,
      lastEventAt: '2026-04-26T12:00:00.000Z',
      totalProfiles: 10,
      verifiedProfiles: 4,
      completedProfiles: 7,
      totalMessages: 12,
      totalFavorites: 9,
    },
    acquisition: {
      signupCompleted: 6,
      emailVerified: 5,
      onboardingCompleted: 4,
      funnel: [
        { label: 'Signups completed', value: 6 },
        { label: 'Emails verified', value: 5 },
      ],
    },
    search: {
      submitted: 8,
      resultsLoaded: 7,
      zeroResults: 1,
      resultClicks: 5,
      savedSearches: 3,
      averageResultsPerSearch: 2.5,
      topQueries: [{ label: 'hiking', value: 3 }],
      topPassions: [{ label: 'Travel', value: 4 }],
      topLocations: [{ label: 'Berlin', value: 2 }],
      topLanguages: [{ label: 'English', value: 4 }],
    },
    engagement: {
      profileViews: 9,
      favoritesAdded: 4,
      favoritesRemoved: 1,
      messageStarted: 3,
      messagesSent: 2,
      funnel: [
        { label: 'Profile views', value: 9 },
        { label: 'Favorites added', value: 4 },
      ],
    },
    notifications: {
      total: 6,
      unread: 2,
      activePushSubscriptions: 3,
      pushEnabled: 2,
      pushDisabled: 1,
      notificationOpened: 4,
    },
    trustAndSafety: {
      totalReports: 2,
      pendingReports: 1,
      openReports: 2,
      reportSubmittedTracked: 2,
      totalVerificationRequests: 3,
      pendingVerificationRequests: 1,
      verificationRequestedTracked: 3,
    },
    content: {
      topPaths: [{ label: '/search', value: 10 }],
      topViewedProfiles: [{ label: 'Alice Example', value: 2 }],
      topPassions: [{ label: 'Travel', value: 4 }],
      topLocations: [{ label: 'Berlin', value: 2 }],
      topLanguages: [{ label: 'English', value: 4 }],
    },
    activity: {
      eventsLast7d: 20,
      eventsLast30d: 35,
      activeDaysLast7d: 5,
      activeDaysLast30d: 12,
      trendWindowDays: 30,
      dailySeries: [
        {
          date: '2026-04-25',
          label: 'Apr 25',
          totalEvents: 10,
          searches: 3,
          messages: 2,
          favorites: 1,
          profileViews: 2,
          notifications: 1,
        },
        {
          date: '2026-04-26',
          label: 'Apr 26',
          totalEvents: 12,
          searches: 4,
          messages: 3,
          favorites: 2,
          profileViews: 1,
          notifications: 2,
        },
      ],
      peakDay: {
        date: '2026-04-26',
        label: 'Apr 26',
        totalEvents: 12,
      },
    },
    rates: {
      searchClickThroughRate: 62.5,
      zeroResultRate: 12.5,
      verificationRate: 83.3,
      onboardingCompletionRate: 66.7,
      favoritesToMessageRate: 75,
      messageCompletionRate: 66.7,
      pushAdoptionRate: 75,
      notificationOpenRate: 66.7,
    },
    health: {
      score: 86,
      items: [
        {
          title: 'Analytics feed',
          status: 'good',
          detail: '42 events captured in the last 30 days.',
        },
      ],
    },
    eventLeaderboard: [{ label: 'page_view', value: 18 }],
    recentEvents: [
      {
        id: 'event-1',
        eventName: 'search_submitted',
        path: '/search',
        createdAt: '2026-04-26T12:00:00.000Z',
        properties: { query: 'hiking' },
      },
    ],
  },
  queues: {
    reports: [
      {
        id: 'report-1',
        reason: 'Spam message',
        status: 'pending',
        createdAt: '2026-04-25T12:00:00.000Z',
        reporterId: 'user-9',
        reportedId: 'user-1',
        reporter: {
          id: 'user-9',
          firstName: 'Casey',
          lastName: 'Reporter',
          displayName: 'Casey Reporter',
          verified: false,
          location: 'Lisbon, Portugal',
          avatarUrl: null,
        },
        reported: {
          id: 'user-1',
          firstName: 'Alice',
          lastName: 'Example',
          displayName: 'Alice Example',
          verified: true,
          location: 'Berlin, Germany',
          avatarUrl: null,
        },
      },
    ],
    verificationRequests: [
      {
        id: 'verification-1',
        userId: 'user-2',
        status: 'pending',
        createdAt: '2026-04-24T12:00:00.000Z',
        profile: {
          id: 'user-2',
          firstName: 'Bob',
          lastName: 'Example',
          displayName: 'Bob Example',
          verified: false,
          location: 'Paris, France',
          avatarUrl: null,
        },
      },
    ],
  },
  quickActions: {
    pendingReports: 1,
    pendingVerificationRequests: 1,
    flaggedUsers: 1,
    unreadNotifications: 2,
    totalQueueItems: 2,
  },
  systemControls: {
    maintenanceBannerText: '',
    analyticsRefreshMinutes: 15,
    moderationHold: false,
    followUpUserIds: ['user-1'],
    updatedAt: '2026-04-26T12:05:00.000Z',
  },
  lastUpdatedAt: '2026-04-26T12:30:00.000Z',
};

const aliceUser = {
  id: 'user-1',
  displayName: 'Alice Example',
  firstName: 'Alice',
  lastName: 'Example',
  verified: true,
  location: 'Berlin, Germany',
  joinedAt: '2026-01-10T12:00:00.000Z',
  lastActiveAt: '2026-04-26T12:00:00.000Z',
  openReports: 1,
  pendingVerification: false,
  savedSearchCount: 2,
  blockedCount: 1,
  messageCount: 6,
  flaggedForFollowUp: true,
};

const bobUser = {
  id: 'user-2',
  displayName: 'Bob Example',
  firstName: 'Bob',
  lastName: 'Example',
  verified: false,
  location: 'Paris, France',
  joinedAt: '2026-02-01T12:00:00.000Z',
  lastActiveAt: '2026-04-25T12:00:00.000Z',
  openReports: 0,
  pendingVerification: true,
  savedSearchCount: 1,
  blockedCount: 0,
  messageCount: 3,
  flaggedForFollowUp: false,
};

const aliceInvestigation = {
  user: {
    ...aliceUser,
    aboutMe: 'Avid hiker and language learner.',
    age: 29,
    gender: 'woman',
    passions: ['Travel', 'Outdoors'],
    languages: ['English', 'German'],
    isPrivate: false,
  },
  messages: [
    {
      id: 'message-1',
      createdAt: '2026-04-26T11:00:00.000Z',
      direction: 'received',
      content: 'Looking forward to meeting this weekend.',
      sender: { id: 'user-9', firstName: 'Casey', lastName: 'Reporter' },
      receiver: { id: 'user-1', firstName: 'Alice', lastName: 'Example' },
    },
  ],
  savedSearches: [
    {
      id: 'search-1',
      name: 'Berlin hikers',
      query: 'hiking',
      location: 'Berlin',
      language: 'English',
      gender: null,
      minAge: 25,
      maxAge: 35,
      passionIds: ['travel'],
      createdAt: '2026-04-20T12:00:00.000Z',
    },
  ],
  blockedUsers: [
    {
      id: 'blocked-1',
      blockedId: 'user-8',
      createdAt: '2026-04-18T12:00:00.000Z',
      profile: {
        id: 'user-8',
        firstName: 'Dana',
        lastName: 'Blocked',
        displayName: 'Dana Blocked',
        verified: false,
        location: 'Madrid, Spain',
        avatarUrl: null,
      },
    },
  ],
  verificationHistory: [
    {
      id: 'verification-history-1',
      status: 'approved',
      createdAt: '2026-03-15T12:00:00.000Z',
    },
  ],
  notifications: [
    {
      id: 'notification-1',
      type: 'admin_notice',
      read: false,
      createdAt: '2026-04-19T12:00:00.000Z',
      actorId: 'admin-1',
      title: 'Profile follow-up',
      body: 'Please update your profile photos.',
      url: '/notifications',
    },
  ],
  reportsFiled: [],
  reportsAgainst: [baseDashboardPayload.queues.reports[0]],
};

const bobInvestigation = {
  ...aliceInvestigation,
  user: {
    ...bobUser,
    aboutMe: 'Building trust before applying again.',
    age: 31,
    gender: 'man',
    passions: ['Cooking'],
    languages: ['French'],
    isPrivate: false,
  },
  verificationHistory: [
    {
      id: 'verification-history-2',
      status: 'pending',
      createdAt: '2026-04-24T12:00:00.000Z',
    },
  ],
  reportsAgainst: [],
};

test.describe('Admin', () => {
  test.describe('Unauthenticated Access', () => {
    test('should redirect to login when accessing admin without authentication', async ({ page }) => {
      await expectLoginRedirect(page, '/admin');
    });
  });

  test.describe('Command Center', () => {
    test('should let an allowlisted admin review queues, search users, and save controls with mocked admin APIs', async ({ page }) => {
      const dashboardPayload = clone(baseDashboardPayload);
      const baseURL = process.env.BASE_URL || 'http://localhost:3000';
      const { hostname } = new URL(baseURL);
      const dialogMessages: string[] = [];
      const userQueries: string[] = [];
      const investigationRequests: string[] = [];
      let reportUpdateBody: Record<string, unknown> | null = null;
      let savedSettingsBody: Record<string, unknown> | null = null;

      page.on('dialog', (dialog) => {
        dialogMessages.push(dialog.message());
        void dialog.accept();
      });

      await page.context().setExtraHTTPHeaders({
        [E2E_AUTH_HEADER_NAME]: E2E_AUTH_ADMIN_COOKIE_VALUE,
      });

      await page.addInitScript((sessionPayload) => {
        const originalFetch = window.fetch.bind(window);

        window.fetch = async (input, init) => {
          const rawUrl =
            typeof input === 'string'
              ? input
              : input instanceof Request
                ? input.url
                : String(input);

          const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, window.location.origin).toString();

          if (normalizedUrl.includes('/api/auth/session')) {
            return new Response(JSON.stringify(sessionPayload), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }

          return originalFetch(input, init);
        };
      }, adminSessionPayload);

      await page.context().addCookies([
        {
          name: E2E_AUTH_COOKIE_NAME,
          value: E2E_AUTH_ADMIN_COOKIE_VALUE,
          domain: hostname,
          path: '/',
        },
      ]);

      await page.route('**/api/admin/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const method = request.method();

        if (method === 'GET' && url.pathname === '/api/admin/analytics') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(dashboardPayload),
          });
          return;
        }

        if (method === 'GET' && url.pathname === '/api/admin/users') {
          const query = url.searchParams.get('query')?.trim().toLowerCase() ?? '';
          if (query) {
            userQueries.push(query);
          }

          const payload = query === 'bob' ? [bobUser] : [aliceUser, bobUser];
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(payload),
          });
          return;
        }

        if (method === 'GET' && url.pathname === '/api/admin/users/user-1') {
          investigationRequests.push('user-1');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(aliceInvestigation),
          });
          return;
        }

        if (method === 'GET' && url.pathname === '/api/admin/users/user-2') {
          investigationRequests.push('user-2');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(bobInvestigation),
          });
          return;
        }

        if (method === 'PATCH' && url.pathname === '/api/admin/reports/report-1') {
          reportUpdateBody = request.postDataJSON() as Record<string, unknown>;
          dashboardPayload.queues.reports = [];
          dashboardPayload.quickActions.pendingReports = 0;
          dashboardPayload.quickActions.totalQueueItems = 1;
          dashboardPayload.analytics.trustAndSafety.pendingReports = 0;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          });
          return;
        }

        if (method === 'GET' && url.pathname === '/api/admin/settings') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(dashboardPayload.systemControls),
          });
          return;
        }

        if (method === 'PATCH' && url.pathname === '/api/admin/settings') {
          savedSettingsBody = request.postDataJSON() as Record<string, unknown>;
          dashboardPayload.systemControls = {
            maintenanceBannerText: 'Maintenance starts at 22:00 UTC',
            analyticsRefreshMinutes: 30,
            moderationHold: true,
            followUpUserIds: ['user-1'],
            updatedAt: '2026-04-26T13:00:00.000Z',
          };

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(dashboardPayload.systemControls),
          });
          return;
        }

        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: `Unhandled admin route: ${method} ${url.pathname}` }),
        });
      });

      await page.goto('/admin');

      await expect(page.getByRole('heading', { name: 'Admin Command Center' })).toBeVisible();

      // Queue management sub-page
      await page.goto('/admin/queues');
      await expect(page.getByText('Embedded queues')).toBeVisible();
      await expect(page.getByText('Alice Example')).toBeVisible();

      await page.getByRole('button', { name: 'Mark reviewed' }).click();

      await expect(page.getByRole('button', { name: 'Mark reviewed' })).toHaveCount(0);
      expect(dialogMessages).toContain('Mark this report as reviewed?');
      expect(reportUpdateBody).toEqual({ status: 'reviewed' });

      // User investigation sub-page
      await page.goto('/admin/users');
      await expect(page.getByText('User investigation')).toBeVisible();

      await page.getByPlaceholder('Search by name or user ID').fill('bob');
      await page.getByRole('button', { name: 'Search users' }).click();

      await expect(page.getByRole('heading', { level: 3, name: 'Bob Example' })).toBeVisible();
      await expect(page.getByText('Building trust before applying again.')).toBeVisible();
      expect(userQueries).toContain('bob');
      expect(investigationRequests).toContain('user-2');

      // System controls sub-page
      await page.goto('/admin/controls');
      await expect(page.getByText('System controls')).toBeVisible();
      await page.getByLabel('Maintenance banner text').fill('Maintenance starts at 22:00 UTC');
      await page.getByLabel('Auto-refresh cadence (minutes)').fill('30');
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Save controls' }).click();

      await expect(page.getByLabel('Maintenance banner text')).toHaveValue('Maintenance starts at 22:00 UTC');
      await expect(page.getByLabel('Auto-refresh cadence (minutes)')).toHaveValue('30');
      expect(savedSettingsBody).toEqual(
        expect.objectContaining({
          maintenanceBannerText: 'Maintenance starts at 22:00 UTC',
          analyticsRefreshMinutes: 30,
          moderationHold: true,
        })
      );
    });
  });

  test.describe('Admin Page Structure', () => {
    test('should handle unauthenticated admin access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin');
    });
  });

  test.describe('Admin Verification', () => {
    test('should handle unauthenticated admin verification access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin/verification');
    });
  });

  test.describe('Admin Reports', () => {
    test('should handle unauthenticated admin reports access', async ({ page }) => {
      await expectLoginRedirect(page, '/admin/reports');
    });
  });
});

test.describe('Error Pages', () => {
  test('should display 404 page for unknown routes', async ({ page }) => {
    await expectNotFoundPage(page, '/this-page-does-not-exist-12345');
  });

  test('should handle unknown routes', async ({ page }) => {
    await expectNotFoundPage(page, '/another-fake-page');
  });
});

test.describe('Loading States', () => {
  test('should handle unauthenticated dashboard access', async ({ page }) => {
    await expectLoginRedirect(page, '/dashboard');
  });

  test('should handle unauthenticated messages access', async ({ page }) => {
    await expectLoginRedirect(page, '/messages');
  });

  test('should handle unauthenticated profile access', async ({ page }) => {
    await expectLoginRedirect(page, '/profile');
  });
});
