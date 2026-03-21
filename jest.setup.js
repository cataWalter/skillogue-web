// Basic setup for testing without Drizzle/Postgres
import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID = 'test-db';
process.env.APPWRITE_API_KEY = 'test-key';

// Mock Next.js cache APIs for server actions tests
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  cacheTag: jest.fn(),
}));
