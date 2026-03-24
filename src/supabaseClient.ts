import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;
let initializationAttempted = false;

const isValidSupabaseUrl = (url: string | undefined): boolean => {
  if (!url || !url.trim()) return false;
  try {
    new URL(url);
    return url.startsWith('https://');
  } catch {
    return false;
  }
};

const createSupabaseClient = (): SupabaseClient | null => {
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
    supabaseInstance = createClient(supabaseUrl as string, supabaseAnonKey as string, {
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
export const getSupabase = (): SupabaseClient | null => {
  return createSupabaseClient();
};

// Keep the old export for backward compatibility with a safe proxy
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabase();
    if (!client) {
      // Return undefined for properties if client couldn't be initialized
      return undefined;
    }
    return Reflect.get(client, prop, target);
  },
});
