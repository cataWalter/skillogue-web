import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env vars are missing or empty, use a valid placeholder URL for build time
  // At runtime, the real Supabase client will be used when env vars are available
  const url = (supabaseUrl && supabaseUrl.trim()) ? supabaseUrl : 'https://placeholder.supabase.co';
  const key = (supabaseAnonKey && supabaseAnonKey.trim()) ? supabaseAnonKey : 'placeholder-key';

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
};

// Lazy initialize the supabase client on first use
export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = getSupabaseClient();
  }
  return supabaseInstance;
};

// Keep the old export for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    return (client as any)[prop];
  },
});
