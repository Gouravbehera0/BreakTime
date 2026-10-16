import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tablesNeedCreation?: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured in environment variables.',
    };
  }

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        return {
          connected: true,
          tablesNeedCreation: true,
          message: 'Connected to Supabase endpoint! Database tables (public.profiles) have not been created yet in the SQL Editor.',
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
