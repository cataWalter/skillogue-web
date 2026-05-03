import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const getTursoUrl = () => process.env.TURSO_DATABASE_URL?.trim() ?? '';
const getTursoAuthToken = () => process.env.TURSO_AUTH_TOKEN?.trim() ?? '';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = () => {
  if (!_db) {
    const url = getTursoUrl();
    const authToken = getTursoAuthToken();

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not configured.');
    }

    const client = createClient({ url, authToken: authToken || undefined });
    _db = drizzle(client, { schema });
  }

  return _db;
};

export { schema };
export * from './schema';
