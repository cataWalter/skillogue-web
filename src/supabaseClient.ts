import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export const supabase = getSupabaseClient();
