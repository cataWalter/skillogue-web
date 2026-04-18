'use client';

import { Client as AppwriteBrowserClient } from 'appwrite';
import { useEffect, useState } from 'react';
import {
  getAppwriteCollectionId,
  getAppwriteDatabaseId,
  getAppwriteEndpoint,
  getAppwriteProjectId,
  isAppwritePublicConfigReady,
} from '@/lib/appwrite/config';

type CompatError = {
  message: string;
  code?: string;
};

type SessionUser = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

type SessionPayload = {
  session: {
    user: SessionUser;
    expires?: string;
  } | null;
};

type CollectionFilter =
  | { type: 'eq'; column: string; value: unknown }
  | { type: 'in'; column: string; value: unknown[] }
  | { type: 'or'; expression: string };

type CollectionOperation = {
  action: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  select?: string | null;
  filters?: CollectionFilter[];
  order?: { column: string; ascending: boolean } | null;
  range?: { from: number; to: number } | null;
  limit?: number | null;
  single?: boolean;
  maybeSingle?: boolean;
  payload?: any;
};

type QueryResponse<T = any> = {
  data: T;
  error: CompatError | null;
};

const parseResponse = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const buildError = (message: string, code?: string): CompatError => ({ message, code });

const hasSessionPayload = (value: unknown): value is SessionPayload => {
  return Boolean(value && typeof value === 'object' && 'session' in value);
};

const toCompatResponse = async <T>(response: Response): Promise<QueryResponse<T>> => {
  const payload = (await parseResponse(response)) as QueryResponse<T> | { message?: string; error?: string; code?: string } | null;

  if (!response.ok) {
    return {
      data: null as T,
      error: buildError(
        payload && typeof payload === 'object'
          ? (payload as { message?: string; error?: string }).message || (payload as { error?: string }).error || `Request failed with status ${response.status}`
          : `Request failed with status ${response.status}`,
        payload && typeof payload === 'object' && 'code' in payload ? String((payload as { code?: unknown }).code) : undefined
      ),
    };
  }

  return (payload as QueryResponse<T>) ?? { data: null as T, error: null };
};

const fetchSession = async () => {
  const response = await fetch('/api/auth/session', { cache: 'no-store' });
  const payload = (await parseResponse(response)) as SessionPayload | { message?: string } | null;

  if (!response.ok) {
    return {
      session: null,
      error: buildError(
        payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
          ? payload.message
          : 'Failed to fetch session.'
      ),
    };
  }

  return {
    session: hasSessionPayload(payload) ? payload.session : null,
    error: null,
  };
};

let realtimeClient: AppwriteBrowserClient | null = null;

const getRealtimeClient = () => {
  if (typeof window === 'undefined' || !isAppwritePublicConfigReady()) {
    return null;
  }

  if (!realtimeClient) {
    realtimeClient = new AppwriteBrowserClient()
      .setEndpoint(getAppwriteEndpoint())
      .setProject(getAppwriteProjectId());
  }

  return realtimeClient;
};

const normalizeRealtimePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const normalized = { ...payload };

  if (!normalized.id && typeof normalized.$id === 'string') {
    normalized.id = normalized.$id;
  }

  if (!normalized.created_at && typeof normalized.$createdAt === 'string') {
    normalized.created_at = normalized.$createdAt;
  }

  return normalized;
};

const matchesRealtimeFilter = (payload: Record<string, any>, filter?: string) => {
  if (!filter) {
    return true;
  }

  const [column, matcher] = filter.split('=eq.');

  if (!column || matcher === undefined) {
    return true;
  }

  return String(payload[column]) === matcher;
};

class CompatChannel {
  private readonly name: string;
  private readonly changeHandlers: Array<{
    config: { event?: string; table?: string; filter?: string };
    callback: (payload: { new: any }) => void;
  }> = [];
  private readonly presenceHandlers: Array<() => void> = [];
  private readonly unsubscribeCallbacks: Array<() => void> = [];
  private readonly trackedPresence: Record<string, any[]> = {};

  constructor(name: string) {
    this.name = name;
  }

  on(
    eventType: 'postgres_changes' | 'presence',
    config: Record<string, any>,
    callback: (payload?: any) => void
  ) {
    if (eventType === 'postgres_changes') {
      this.changeHandlers.push({
        config: {
          event: config.event,
          table: config.table,
          filter: config.filter,
        },
        callback: callback as (payload: { new: any }) => void,
      });
    }

    if (eventType === 'presence') {
      this.presenceHandlers.push(() => callback());
    }

    return this;
  }

  subscribe(callback?: (status: string) => void) {
    const client = getRealtimeClient();
    const channels = Array.from(
      new Set(
        this.changeHandlers
          .map((handler) => {
            if (!handler.config.table) {
              return null;
            }

            return `databases.${getAppwriteDatabaseId()}.collections.${getAppwriteCollectionId(handler.config.table)}.documents`;
          })
          .filter(Boolean)
      )
    ) as string[];

    if (client && channels.length) {
      const unsubscribe = (client as any).subscribe(channels, (event: any) => {
        const payload = normalizeRealtimePayload(event?.payload ?? {});
        const joinedEvents = Array.isArray(event?.events) ? event.events.join(' ') : '';

        for (const handler of this.changeHandlers) {
          if (handler.config.event === 'INSERT' && !joinedEvents.includes('.create')) {
            continue;
          }

          if (handler.config.event === 'UPDATE' && !joinedEvents.includes('.update')) {
            continue;
          }

          if (handler.config.event === 'DELETE' && !joinedEvents.includes('.delete')) {
            continue;
          }

          if (!matchesRealtimeFilter(payload, handler.config.filter)) {
            continue;
          }

          handler.callback({ new: payload });
        }
      });

      if (typeof unsubscribe === 'function') {
        this.unsubscribeCallbacks.push(unsubscribe);
      }
    }

    queueMicrotask(() => callback?.('SUBSCRIBED'));

    if (this.presenceHandlers.length) {
      queueMicrotask(() => {
        for (const handler of this.presenceHandlers) {
          handler();
        }
      });
    }

    return this;
  }

  async track(payload: Record<string, any>) {
    if (payload?.user_id) {
      this.trackedPresence[String(payload.user_id)] = [payload];
    }

    for (const handler of this.presenceHandlers) {
      handler();
    }
  }

  presenceState() {
    return this.trackedPresence;
  }

  unsubscribe() {
    for (const callback of this.unsubscribeCallbacks) {
      callback();
    }
    this.unsubscribeCallbacks.length = 0;
  }
}

class CompatQueryBuilder<T = any> implements PromiseLike<QueryResponse<T>> {
  private readonly collection: string;
  private readonly operation: CollectionOperation;

  constructor(collection: string) {
    this.collection = collection;
    this.operation = {
      action: 'select',
      filters: [],
      order: null,
      range: null,
      limit: null,
      select: null,
      single: false,
      maybeSingle: false,
      payload: undefined,
    };
  }

  select(columns = '*') {
    this.operation.select = columns;
    return this;
  }

  insert(payload: any) {
    this.operation.action = 'insert';
    this.operation.payload = payload;
    return this;
  }

  upsert(payload: any) {
    this.operation.action = 'upsert';
    this.operation.payload = payload;
    return this;
  }

  update(payload: any) {
    this.operation.action = 'update';
    this.operation.payload = payload;
    return this;
  }

  delete() {
    this.operation.action = 'delete';
    return this;
  }

  eq(column: string, value: unknown) {
    this.operation.filters?.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, value: unknown[]) {
    this.operation.filters?.push({ type: 'in', column, value });
    return this;
  }

  or(expression: string) {
    this.operation.filters?.push({ type: 'or', expression });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.operation.order = {
      column,
      ascending: options?.ascending !== false,
    };
    return this;
  }

  range(from: number, to: number) {
    this.operation.range = { from, to };
    return this;
  }

  limit(limit: number) {
    this.operation.limit = limit;
    return this;
  }

  single() {
    this.operation.single = true;
    return this;
  }

  maybeSingle() {
    this.operation.maybeSingle = true;
    return this;
  }

  private async execute() {
    const response = await fetch(`/api/internal/collection/${encodeURIComponent(this.collection)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.operation),
    });

    return toCompatResponse<T>(response);
  }

  then<TResult1 = QueryResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const getClient = () => appClient;

export const useAppClient = () => appClient;

export const useUserSession = () => {
  const [session, setSession] = useState<SessionPayload['session']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetchSession()
      .then((result) => {
        if (!active) {
          return;
        }

        setSession(result.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSession(null);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { session, loading };
};

export const appClient = {
  useAppClient,
  useUserSession,
  auth: {
    async getSession() {
      const { session, error } = await fetchSession();
      return {
        data: { session },
        error,
      };
    },
    async getUser() {
      const { session, error } = await fetchSession();
      return {
        data: { user: session?.user ?? null },
        error,
      };
    },
    async signInWithPassword(credentials: { email: string; password: string }) {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const payload = await parseResponse(response);

      if (!response.ok) {
        return {
          data: null,
          error: buildError(payload?.message || 'Failed to sign in.'),
        };
      }

      return {
        data: payload,
        error: null,
      };
    },
    async signUp(credentials: { email: string; password: string }) {
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const payload = await parseResponse(response);

      if (!response.ok) {
        return {
          data: null,
          error: buildError(payload?.message || 'Failed to sign up.'),
        };
      }

      return {
        data: payload,
        error: null,
      };
    },
    async signOut() {
      await fetch('/api/auth/sign-out', { method: 'POST' });
      return { error: null };
    },
  },
  from<T = any>(collection: string) {
    return new CompatQueryBuilder<T>(collection);
  },
  async rpc<T = any>(name: string, args?: Record<string, any>) {
    const response = await fetch('/api/internal/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, args: args ?? {} }),
    });

    return toCompatResponse<T>(response);
  },
  functions: {
    async invoke(name: string, options?: { body?: Record<string, any> }) {
      const response = await fetch(`/api/internal/function/${encodeURIComponent(name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: options?.body ?? {} }),
      });
      const payload = await parseResponse(response);

      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to invoke function.');
      }

      return payload;
    },
  },
  channel(name: string) {
    return new CompatChannel(name);
  },
  removeChannel(channel: CompatChannel) {
    channel.unsubscribe();
  },
} as const;

export const handleSignOut = async () => {
  await appClient.auth.signOut();
  window.location.href = '/login';
};
