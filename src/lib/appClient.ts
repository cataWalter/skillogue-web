import { fetchAuthSession, fetchAuthUser, signOutAuth } from '@/lib/appwrite/client-auth';

type QueryResult<T = unknown> = {
  data: T;
  error: { message: string; code?: string } | null;
};

type QueryFilter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; values: unknown[] }
  | { type: 'or'; expression: string };

type QueryState = {
  table: string;
  operation: 'select' | 'insert' | 'update' | 'upsert' | 'delete';
  select?: string;
  returning?: string;
  payload?: unknown;
  filters: QueryFilter[];
  order?: { column: string; ascending?: boolean };
  range?: { from: number; to: number };
  modifiers?: { single?: boolean; maybeSingle?: boolean };
};

const postJson = async <T>(url: string, payload: unknown): Promise<QueryResult<T>> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return (await response.json()) as QueryResult<T>;
  } catch (error) {
    return {
      data: null as T,
      error: { message: error instanceof Error ? error.message : 'Request failed.' },
    };
  }
};

class CompatQueryBuilder<T = unknown> implements PromiseLike<QueryResult<T>> {
  private state: QueryState;
  private execution?: Promise<QueryResult<T>>;

  constructor(table: string) {
    this.state = {
      table,
      operation: 'select',
      filters: [],
    };
  }

  select(columns = '*') {
    if (this.state.operation === 'insert' || this.state.operation === 'update' || this.state.operation === 'upsert') {
      this.state.returning = columns;
      return this;
    }

    this.state.operation = 'select';
    this.state.select = columns;
    return this;
  }

  insert(payload: unknown) {
    this.state.operation = 'insert';
    this.state.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.state.operation = 'update';
    this.state.payload = payload;
    return this;
  }

  upsert(payload: unknown) {
    this.state.operation = 'upsert';
    this.state.payload = payload;
    return this;
  }

  delete() {
    this.state.operation = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.state.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.state.filters.push({ type: 'in', column, values });
    return this;
  }

  or(expression: string) {
    this.state.filters.push({ type: 'or', expression });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.state.order = { column, ascending: options?.ascending };
    return this;
  }

  range(from: number, to: number) {
    this.state.range = { from, to };
    return this;
  }

  single() {
    this.state.modifiers = { ...this.state.modifiers, single: true };
    return this.execute();
  }

  maybeSingle() {
    this.state.modifiers = { ...this.state.modifiers, maybeSingle: true };
    return this.execute();
  }

  then<TResult1 = QueryResult<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    if (!this.execution) {
      this.execution = postJson<T>('/api/internal/query', this.state);
    }

    return this.execution;
  }
}

const createChannel = (name: string) => {
  const channel = {
    name,
    on: () => channel,
    subscribe: (callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
      return channel;
    },
    presenceState: () => ({}),
    track: async () => undefined,
    unsubscribe: async () => undefined,
  };

  return channel;
};

export const getAppClient = () => ({
  auth: {
    getSession: async () => {
      const session = await fetchAuthSession();
      return { data: { session }, error: null };
    },
    getUser: async () => {
      const user = await fetchAuthUser();
      return { data: { user }, error: null };
    },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        return { data: { session: null, user: null }, error: { message: payload?.message ?? 'Failed to sign in.' } };
      }

      const session = await fetchAuthSession();
      return { data: { session, user: session?.user ?? null }, error: null };
    },
    signUp: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        return { data: null, error: { message: payload?.message ?? 'Failed to sign up.' } };
      }

      return { data: payload, error: null };
    },
    signOut: async () => {
      await signOutAuth();
      return { error: null };
    },
    updateUser: async () => ({ error: { message: 'Use the Appwrite password recovery flow instead.' } }),
  },
  from: (table: string) => new CompatQueryBuilder(table),
  rpc: <T = unknown>(name: string, args: Record<string, unknown> = {}) =>
    postJson<T>('/api/internal/rpc', { name, args }),
  functions: {
    invoke: <T = unknown>(name: string, payload: { body?: Record<string, unknown> }) =>
      postJson<T>(`/api/internal/function/${name}`, payload),
  },
  channel: (name: string) => createChannel(name),
  removeChannel: () => undefined,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const appClient = getAppClient() as any;
