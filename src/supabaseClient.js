// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;
let initializationAttempted = false;

const isValidSupabaseUrl = (url) => {
  if (!url || !url.trim()) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const createSupabaseClient = () => {
  if (initializationAttempted) {
    return supabaseInstance;
  }
  
  initializationAttempted = true;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only create client if both env vars are valid
  if (!isValidSupabaseUrl(supabaseUrl) || !supabaseAnonKey?.trim()) {
    console.warn(
      'Supabase client not initialized: Missing or invalid environment variables. ' +
      'This is expected during build time.'
    );
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

// Lazy initialize the supabase client on first use
const getSupabase = () => {
  return createSupabaseClient();
};

// Keep the old export for backward compatibility with a safe proxy
const supabase = new Proxy({}, {
  get: (target, prop) => {
    const client = getSupabase();
    if (!client) {
      // Return undefined for properties if client couldn't be initialized
      return undefined;
    }
    return client[prop];
  },
});

export { supabase, getSupabase };
