import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { hostFromHeader, isPlatformHost, parsePlatformHosts } from "@/lib/domains/hostname";
import { handleCustomDomain } from "@/lib/domains/custom-domain-proxy";

const platformHosts = parsePlatformHosts(process.env.PLATFORM_HOSTS);

export async function proxy(request: NextRequest) {
  const host = hostFromHeader(
    request.headers.get("x-forwarded-host") || request.headers.get("host")
  );

  if (!isPlatformHost(host, platformHosts)) {
    return await handleCustomDomain(request, host);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|assets/).*)",
  ],
};
