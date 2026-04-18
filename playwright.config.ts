import { defineConfig, devices } from '@playwright/test';
import type { NextcovConfig } from 'nextcov';

const baseURL = process.env.BASE_URL || 'http://localhost:3000';
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || 'npm run dev';
const shouldReuseExistingServer = !process.env.CI && !process.env.PLAYWRIGHT_WEB_SERVER_COMMAND;
const shouldStartWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== '1';
const shouldCollectCoverage = process.env.PLAYWRIGHT_COLLECT_COVERAGE === '1';

export const nextcov: NextcovConfig = {
  cdpPort: 9330,
  buildDir: '.next',
  outputDir: 'coverage/e2e',
  sourceRoot: './src',
  include: ['src/**/*.{ts,tsx,js,jsx}'],
  exclude: [
    'src/**/__tests__/**',
    'src/**/*.test.{ts,tsx,js,jsx}',
    'src/**/*.spec.{ts,tsx,js,jsx}',
  ],
  reporters: ['html', 'lcov', 'json', 'text-summary'],
  log: true,
};

const config: Parameters<typeof defineConfig>[0] & { nextcov?: NextcovConfig } = {
  testDir: './__tests__/e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  expect: {
    timeout: process.env.CI ? 30000 : 15000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  ...(shouldStartWebServer
    ? {
        webServer: {
          command: webServerCommand,
          url: baseURL,
          reuseExistingServer: shouldReuseExistingServer,
          timeout: 120000,
        },
      }
    : {}),
  ...(shouldCollectCoverage
    ? {
        globalSetup: './__tests__/e2e/global-setup.ts',
        globalTeardown: './__tests__/e2e/global-teardown.ts',
        nextcov,
      }
    : {}),
};

export default defineConfig(config);
