import { createClient } from '@supabase/supabase-js';

// --- User-Specific Configuration ---
// Hardcoding credentials as requested for the user's specific project.
const supabaseUrl = 'https://fpffhshknnjfukxljryv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmZoc2hrbm5qZnVreGxqcnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDIyMjcsImV4cCI6MjA3NzExODIyN30.t7XeZXxGjErP2w-JYLeSzfpmLqQLj0sriFgwp0V-bVI';


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
