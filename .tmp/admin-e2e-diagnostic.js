const { chromium } = require('@playwright/test');

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

const dashboardPayload = {
  analytics: {
    range: { days: 30, label: 'Last 30 days', trendWindowDays: 30 },
    filters: {
      eventType: null,
      path: null,
      availableEventTypes: [],
      availablePaths: [],
      exportUrl: '/api/admin/analytics?days=30&export=json',
    },
    overview: {
      totalEvents: 1,
      pageViews: 1,
      uniquePaths: 1,
      lastEventAt: '2026-04-26T12:00:00.000Z',
      totalProfiles: 1,
      verifiedProfiles: 1,
      completedProfiles: 1,
      totalMessages: 1,
      totalFavorites: 1,
    },
    acquisition: { signupCompleted: 1, emailVerified: 1, onboardingCompleted: 1, funnel: [] },
    search: {
      submitted: 1,
      resultsLoaded: 1,
      zeroResults: 0,
      resultClicks: 1,
      savedSearches: 0,
      averageResultsPerSearch: 1,
      topQueries: [],
      topPassions: [],
      topLocations: [],
      topLanguages: [],
    },
    engagement: {
      profileViews: 1,
      favoritesAdded: 1,
      favoritesRemoved: 0,
      messageStarted: 1,
      messagesSent: 1,
      funnel: [],
    },
    notifications: {
      total: 0,
      unread: 0,
      activePushSubscriptions: 0,
      pushEnabled: 0,
      pushDisabled: 0,
      notificationOpened: 0,
    },
    trustAndSafety: {
      totalReports: 0,
      pendingReports: 0,
      openReports: 0,
      reportSubmittedTracked: 0,
      totalVerificationRequests: 0,
      pendingVerificationRequests: 0,
      verificationRequestedTracked: 0,
    },
    content: { topPaths: [], topViewedProfiles: [], topPassions: [], topLocations: [], topLanguages: [] },
    activity: {
      eventsLast7d: 1,
      eventsLast30d: 1,
      activeDaysLast7d: 1,
      activeDaysLast30d: 1,
      trendWindowDays: 30,
      dailySeries: [],
      peakDay: null,
    },
    rates: {
      searchClickThroughRate: 0,
      zeroResultRate: 0,
      verificationRate: 0,
      onboardingCompletionRate: 0,
      favoritesToMessageRate: 0,
      messageCompletionRate: 0,
      pushAdoptionRate: 0,
      notificationOpenRate: 0,
    },
    health: { score: 100, items: [] },
    eventLeaderboard: [],
    recentEvents: [],
  },
  queues: { reports: [], verificationRequests: [] },
  quickActions: {
    pendingReports: 0,
    pendingVerificationRequests: 0,
    flaggedUsers: 0,
    unreadNotifications: 0,
    totalQueueItems: 0,
  },
  systemControls: {
    maintenanceBannerText: '',
    analyticsRefreshMinutes: 15,
    moderationHold: false,
    followUpUserIds: [],
    updatedAt: '2026-04-26T12:05:00.000Z',
  },
  lastUpdatedAt: '2026-04-26T12:30:00.000Z',
};

const userResult = {
  id: 'user-1',
  displayName: 'Alice Example',
  firstName: 'Alice',
  lastName: 'Example',
  verified: true,
  location: 'Berlin, Germany',
  joinedAt: '2026-01-10T12:00:00.000Z',
  lastActiveAt: '2026-04-26T12:00:00.000Z',
  openReports: 0,
  pendingVerification: false,
  savedSearchCount: 0,
  blockedCount: 0,
  messageCount: 0,
  flaggedForFollowUp: false,
};

const userInvestigation = {
  user: {
    ...userResult,
    aboutMe: 'Bio',
    age: 29,
    gender: 'woman',
    passions: [],
    languages: [],
    isPrivate: false,
  },
  messages: [],
  savedSearches: [],
  blockedUsers: [],
  verificationHistory: [],
  notifications: [],
  reportsFiled: [],
  reportsAgainst: [],
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3000',
    extraHTTPHeaders: { 'x-skillogue-e2e-auth': 'admin' },
  });
  await context.addCookies([
    {
      name: 'skillogue_e2e_auth',
      value: 'admin',
      domain: '127.0.0.1',
      path: '/',
    },
  ]);

  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const requests = [];
  let pageClosed = false;
  let pageCrashed = false;

  page.on('console', (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (error) => {
    pageErrors.push(String(error));
  });
  page.on('close', () => {
    pageClosed = true;
  });
  page.on('crash', () => {
    pageCrashed = true;
  });
  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/auth/session') || url.includes('/api/admin/')) {
      requests.push({ stage: 'request', method: request.method(), url });
    }
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/auth/session') || url.includes('/api/admin/')) {
      requests.push({ stage: 'response', status: response.status(), url });
    }
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([userResult]),
      });
      return;
    }

    if (method === 'GET' && url.pathname === '/api/admin/users/user-1') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userInvestigation),
      });
      return;
    }

    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: `Unhandled ${method} ${url.pathname}` }),
    });
  });

  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForTimeout(5000);
  } catch (error) {
    pageErrors.push(`waitForTimeout failed: ${String(error)}`);
  }

  const bodyText = pageClosed ? 'PAGE_CLOSED' : await page.locator('body').innerText().catch(() => 'BODY_UNAVAILABLE');
  console.log(
    JSON.stringify(
      {
        url: page.url(),
        pageClosed,
        pageCrashed,
        bodyText: bodyText.slice(0, 500),
        consoleMessages,
        pageErrors,
        requests,
      },
      null,
      2
    )
  );

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
