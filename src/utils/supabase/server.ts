// src/utils/supabase/server.ts

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for server-side operations in a Next.js App Router environment.
 *
 * This utility function creates a Supabase server client using the `cookies` API from `next/headers`.
 * It supports the asynchronous nature of `cookies()` in Next.js 15+ by wrapping access with `await`.
 *
 * Designed for use in Server Components, Route Handlers, or Server Actions.
 *
 * @returns A Supabase client instance configured for the server with proper cookie handling.
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          /**
           * Retrieves all cookies from the request.
           * Supabase uses this to read the session and authentication state.
           */
          getAll() {
            return cookieStore.getAll();
          },

          /**
           * Sets or removes multiple cookies in the response.
           * Used by Supabase when updating session state (e.g. sign in/out).
           */
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              // In read-only contexts (e.g. during rendering), setting cookies will fail.
              // This is expected if you're using middleware to refresh sessions.
              // Optionally log for debugging: console.debug("Failed to set cookies", error);
            }
          },
        },
      }
  );
};
