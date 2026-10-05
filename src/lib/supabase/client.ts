import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseConfig } from "./config";

/**
 * Supabase client for browser-side operations.
 * Uses the public key — all queries respect RLS policies.
 */
export function createClient() {
  const { url, key } = getSupabaseConfig();

  return createBrowserClient<Database>(url, key);
}
