/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@dicebear/collection$': '<rootDir>/__mocks__/@dicebear/collection.js',
    '^@dicebear/core$': '<rootDir>/__mocks__/@dicebear/core.js',
    '^next/cache$': '<rootDir>/__mocks__/next.js',
  },
  setupFiles: ['<rootDir>/jest.env.js'],
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/e2e/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@clerk/backend|@clerk/nextjs|@clerk/shared|@clerk/types|node-fetch-native-with-agent)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
