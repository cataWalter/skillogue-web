import { test as base, expect } from '@playwright/test';
import { collectClientCoverage } from 'nextcov/playwright';

const shouldCollectCoverage = process.env.PLAYWRIGHT_COLLECT_COVERAGE === '1';

export const test = base.extend<{ coverage: void }>({
  coverage: [
    async ({ browserName, page }, use, testInfo) => {
      if (shouldCollectCoverage && browserName === 'chromium') {
        await collectClientCoverage(page, testInfo, use);
        return;
      }

      await use();
    },
    { scope: 'test', auto: true },
  ],
});

export { expect };
