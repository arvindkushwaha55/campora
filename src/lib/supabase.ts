import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Campora uses ONE Supabase project for auth, the database and file storage.
 *
 * The two values below are PUBLIC client credentials (set in .env.local —
 * see .env.example). The anon key is safe to ship in the browser because
 * every table and storage bucket is protected by Row Level Security: a
 * signed-in user can only read the feed and can only change their own data.
 * The service-role key must NEVER be used in this frontend.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both public env vars are present (local .env.local or CI variables). */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/** Returns the shared Supabase client, or null when keys are not configured. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url as string, anonKey as string);
  }
  return client;
}

/** Extracts a short file extension ("jpg", "png", ...) from a file name. */
export function fileExtension(fileName: string): string {
  const part = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return part ? part : "jpg";
}
