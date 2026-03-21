import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time when env vars aren't available
    // The actual client will be used at runtime when env vars are present
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        persistSession: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = getSupabaseClient();
