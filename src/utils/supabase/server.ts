import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url || !url.trim()) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!isValidSupabaseUrl(url)) {
    throw new Error(
      'Invalid or missing NEXT_PUBLIC_SUPABASE_URL. Please check your environment variables.'
    );
  }
  return url as string;
};

const getSupabaseAnonKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key || !key.trim()) {
    throw new Error(
      'Invalid or missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your environment variables.'
    );
  }
  return key;
};

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
