import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

interface CacheEntry {
  username: string | null;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const domainResolutionCache = new Map<string, CacheEntry>();

let cachedSupabase: ReturnType<typeof createClient<Database>> | null = null;

function getProxySupabase() {
  if (!cachedSupabase) {
    const { url, key } = getSupabaseConfig();
    cachedSupabase = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cachedSupabase;
}

/**
 * Resolves a hostname to a profile username using an in-memory 60s cache.
 */
export async function resolveDomainToUsername(hostname: string): Promise<string | null> {
  const normalized = hostname.toLowerCase();
  const cached = domainResolutionCache.get(normalized);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.username;
  }

  try {
    const supabase = getProxySupabase();
    const { data } = await supabase.rpc("resolve_custom_domain", {
      p_hostname: normalized,
    });

    const username = (data as string | null) ?? null;
    domainResolutionCache.set(normalized, {
      username,
      expiresAt: now + CACHE_TTL_MS,
    });
    return username;
  } catch (err) {
    console.error("Failed to resolve custom domain:", normalized, err);
    return null;
  }
}

/**
 * Handles incoming requests for custom tenant domains.
 *
 * Rules:
 * 1. Root ("/") rewrites to internal "/{username}".
 * 2. Analytics ("/api/click") and public assets pass through.
 * 3. Auth/Dashboard routes redirect permanently to the main platform.
 * 4. Any other path on a custom domain returns 404 to isolate tenant scope.
 */
export async function handleCustomDomain(request: NextRequest, host: string): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const platformAppUrl = process.env.NEXT_PUBLIC_APP_URL || "https://links.cadencecode.com.br";

  // Redirect dashboard and auth routes to the canonical platform domain
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/login" ||
    pathname.startsWith("/auth/")
  ) {
    const targetUrl = new URL(pathname, platformAppUrl);
    targetUrl.search = request.nextUrl.search;
    return NextResponse.redirect(targetUrl, 308);
  }

  // Pass through allowed APIs and static assets
  if (
    pathname.startsWith("/api/click") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Resolve custom domain
  const username = await resolveDomainToUsername(host);
  if (!username) {
    return new NextResponse("Domínio não configurado ou inativo.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // On custom domains, only root is the profile page
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${username}`;
    return NextResponse.rewrite(url, { request });
  }

  // Any other path under a custom domain is not allowed
  return new NextResponse("Página não encontrada.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
