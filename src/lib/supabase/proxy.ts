import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

/** Routes that require authentication */
const PROTECTED_ROUTES = ["/dashboard"];

/** Routes that should redirect to dashboard if already authenticated */
const AUTH_ROUTES = ["/login"];

/**
 * Next.js proxy for Supabase auth session management.
 * Refreshes auth tokens and protects dashboard routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = withSession(NextResponse.next({ request }));
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  function withSession(response: NextResponse) {
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      response.cookies.set(cookie)
    );
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) response.headers.set(header, value);
    }
    return response;
  }

  const { pathname } = request.nextUrl;

  // Rewrite /@username to /username for Next.js routing
  if (pathname.startsWith("/@")) {
    const username = pathname.slice(2);
    const url = request.nextUrl.clone();
    url.pathname = `/${username}`;
    return withSession(NextResponse.rewrite(url, { request }));
  }

  // Protect dashboard routes
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return withSession(NextResponse.redirect(url));
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withSession(NextResponse.redirect(url));
  }

  return supabaseResponse;
}
