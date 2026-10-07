import { createClient } from "@/lib/supabase/server";

/**
 * Anonymous click/copy tracking for public blocks.
 *
 * Why: creators need to know which recommendation/coupon performs, but we keep
 * it LGPD-friendly — no IP, no cookies persisted. Only section id, kind,
 * referrer host and coarse device class reach the DB (via `track_click` RPC,
 * which also refuses unpublished blocks).
 * @see supabase/migrations/20261007120000_dynamic_blocks.sql
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; reset: number }>();

/** Best-effort, in-memory, per-instance limiter (never persisted). */
function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    if (hits.size > 5_000) hits.clear();
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function deviceFrom(userAgent: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

function referrerHost(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try { return new URL(value).hostname.slice(0, 253) || null; } catch { return null; }
}

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(forwarded)) return new Response(null, { status: 429 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }

  const sectionId = body.sectionId;
  const kind = body.kind === "copy" ? "copy" : "click";
  if (typeof sectionId !== "string" || !UUID.test(sectionId)) return new Response(null, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.rpc("track_click", {
    p_section: sectionId,
    p_kind: kind,
    p_referrer: referrerHost(body.referrer),
    p_device: deviceFrom(request.headers.get("user-agent") ?? ""),
  });

  return new Response(null, { status: error ? 422 : 204 });
}
