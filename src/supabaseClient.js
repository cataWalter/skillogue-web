// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

const getSupabaseClient = () => {
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
const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = getSupabaseClient();
  }
  return supabaseInstance;
};

// Keep the old export for backward compatibility
const supabase = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabase();
    return client[prop];
  },
});

export { supabase, getSupabase };
