/**
 * Social handle <-> URL conversion.
 *
 * Why: creators think in "@handle", not URLs. Letting them type the same @
 * they use on Instagram/TikTok removes friction and avoids broken links.
 * Dependency-free so it is unit-testable with `node --test`.
 */

export type HandlePlatform = "instagram" | "tiktok";

export const HANDLE_PLATFORMS: readonly HandlePlatform[] = ["instagram", "tiktok"];

/** Instagram: up to 30 chars; TikTok: up to 24. Both allow letters, digits, "." and "_". */
const HANDLE_RULES: Record<HandlePlatform, { max: number; hosts: string[]; build: (h: string) => string }> = {
  instagram: {
    max: 30,
    hosts: ["instagram.com", "www.instagram.com"],
    build: (handle) => `https://instagram.com/${handle}`,
  },
  tiktok: {
    max: 24,
    hosts: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
    build: (handle) => `https://www.tiktok.com/@${handle}`,
  },
};

export function isHandlePlatform(platform: string): platform is HandlePlatform {
  return (HANDLE_PLATFORMS as readonly string[]).includes(platform);
}

function isValidHandle(platform: HandlePlatform, handle: string): boolean {
  const { max } = HANDLE_RULES[platform];
  return handle.length > 0 && handle.length <= max && /^[a-z0-9._]+$/.test(handle) && !handle.endsWith(".");
}

/** Extracts the handle from a profile URL of the given platform, or null. */
export function urlToHandle(platform: HandlePlatform, value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!HANDLE_RULES[platform].hosts.includes(url.hostname.toLowerCase())) return null;
    const first = url.pathname.split("/").filter(Boolean)[0] ?? "";
    const handle = first.replace(/^@/, "").toLowerCase();
    return isValidHandle(platform, handle) ? handle : null;
  } catch {
    return null;
  }
}

/** Accepts "@handle", "handle" or a full profile URL and returns the bare handle. */
export function normalizeHandle(platform: HandlePlatform, input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return urlToHandle(platform, value);
  const handle = value.replace(/^@/, "").toLowerCase();
  return isValidHandle(platform, handle) ? handle : null;
}

/** Builds the canonical profile URL from any accepted handle input. */
export function handleToUrl(platform: HandlePlatform, input: string): string | null {
  const handle = normalizeHandle(platform, input);
  return handle ? HANDLE_RULES[platform].build(handle) : null;
}
