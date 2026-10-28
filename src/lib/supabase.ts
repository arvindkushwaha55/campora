import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// The URL and anon key are public client credentials: they are safe to ship
// in the browser because Row Level Security (see supabase/schema.sql) is what
// actually protects the data. The secret service-role key must NEVER be here.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
