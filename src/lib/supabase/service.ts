import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates an elevated Supabase client with the service role key.
 *
 * Security: This client bypasses Row Level Security and must only be used in
 * server-side route handlers for operations that users are forbidden from
 * performing directly (such as marking custom domains verified).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurado no servidor.");
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
