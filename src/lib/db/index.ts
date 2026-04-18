// Stub DB module to resolve TypeScript errors
export type PoolClient = any;
export type QueryResult = any;

export const db: any = null;

// Expected exports from various API routes
export const query = async (_text: string, _params?: any[]) => ({
  rows: [] as any[],
  rowCount: 0,
} as QueryResult);

export const connect = async () => ({} as PoolClient);
export const end = async () => {};
