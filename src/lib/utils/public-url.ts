const PROFILE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const WEB_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeProfileLink(value: string, allowContact = false): boolean {
  const candidate = value.trim();
  if (!candidate || candidate.startsWith("//") || candidate.includes("\\")) return false;
  if (candidate.startsWith("/")) return true;
  try {
    const url = new URL(candidate);
    return (allowContact ? PROFILE_LINK_PROTOCOLS : WEB_PROTOCOLS).has(url.protocol);
  } catch {
    return false;
  }
}

export function safeImageSource(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  if (!candidate || candidate.startsWith("//") || candidate.includes("\\")) return null;
  if (candidate.startsWith("/")) return candidate;
  try {
    const url = new URL(candidate);
    return WEB_PROTOCOLS.has(url.protocol) ? candidate : null;
  } catch {
    return null;
  }
}
