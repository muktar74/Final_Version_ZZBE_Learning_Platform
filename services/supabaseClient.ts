
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Read Supabase credentials from the config file.
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;


/**
 * A flag to check if the Supabase configuration is present.
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * The Supabase client instance.
 * It will only be created if the environment variables are set.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : {} as any; // Provide a dummy object if not configured to prevent crashes on import.