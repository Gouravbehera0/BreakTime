import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// 1. Read environment variables with priority on standard publishable key then fallback to anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

/**
 * Checks if Supabase credentials are appropriately configured in the current environment.
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    typeof supabaseKey === 'string' &&
    supabaseKey.length > 20
  );
};

/**
 * Shared, singleton typed Supabase client for BreakTym.
 * Configured with session persistence, automatic token refresh, and URL auth detection.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured()
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'breaktym_auth_session',
      },
    })
  : null;

/**
 * Diagnostic utility to verify live backend reachability and schema readiness.
 * Never claims connection unless verified against the actual endpoint.
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tablesNeedCreation?: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured in environment variables (.env).',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          connected: true,
          tablesNeedCreation: true,
          message:
            'Connected to Supabase endpoint! Database tables (public.profiles) have not been created yet in the SQL Editor.',
        };
      }
      if (error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
        return {
          connected: false,
          message: `Connected to Supabase endpoint, but query returned: ${error.message}`,
        };
      }
    }
    return {
      connected: true,
      tablesNeedCreation: false,
      message: 'Successfully connected to Supabase backend and profiles table is active.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Failed to reach Supabase backend: ${errorMsg}`,
    };
  }
}
