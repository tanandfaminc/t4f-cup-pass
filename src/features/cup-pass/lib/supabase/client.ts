import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase is optional — if env vars are missing, the app falls back to
 * localStorage-only persistence (Milestone 1/2 behaviour).
 */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}
