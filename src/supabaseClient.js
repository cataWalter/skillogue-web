// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time when env vars aren't available
    // The actual client will be used at runtime when env vars are present
    return createClient('http://localhost:54321', 'placeholder-key', {
      auth: {
        persistSession: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

const supabase = getSupabaseClient();

export { supabase };
