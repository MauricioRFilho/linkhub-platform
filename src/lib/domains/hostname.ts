/**
 * Hostname rules for custom domains.
 *
 * Why: the proxy routes by `Host`, so a sloppy hostname would either break
 * routing or let a tenant hijack platform hosts. Kept dependency-free so it
 * runs in the proxy, route handlers, the dashboard and `node --test` alike.
 * @see docs/custom-domains.md
 */

/** Default hosts that serve the platform itself (dashboard, /@user paths). */
export const DEFAULT_PLATFORM_HOSTS = [
  "links.cadencecode.com.br",
  "localhost",
  "127.0.0.1",
  "*.vercel.app",
];

/** Roots no tenant may ever claim (platform, infra and local hosts). */
const BLOCKED_ROOTS = ["cadencecode.com.br", "codecadence.com.br", "vercel.app", "vercel.com", "localhost"];

const HOSTNAME_REGEX = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function matchesRoot(host: string, root: string): boolean {
  return host === root || host.endsWith(`.${root}`);
}

/**
 * Turns user input ("https://WWW.Site.com.br/path", "site.com.br.") into the
 * canonical apex form stored in `custom_domains.hostname` ("site.com.br").
 * Unicode domains are converted to punycode by the URL parser.
 */
export function normalizeHostname(input: string): string {
  let value = input.trim().toLowerCase();
  if (!value) return "";
  if (!/^[a-z][a-z0-9+.-]*:\/\//.test(value)) value = `http://${value}`;
  try {
    value = new URL(value).hostname;
  } catch {
    return "";
  }
  return value.replace(/\.$/, "").replace(/^www\./, "");
}

/** Strips port and lowercases a raw `Host` header. */
export function hostFromHeader(header: string | null | undefined): string {
  return (header ?? "").trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

/** @returns pt-BR error message, or null when the hostname can be claimed. */
export function validateHostname(hostname: string): string | null {
  if (!hostname) return "Informe um domínio.";
  if (hostname.length > 253 || !HOSTNAME_REGEX.test(hostname)) {
    return "Domínio inválido. Use o formato seudominio.com.br, sem http:// nem caminhos.";
  }
  if (BLOCKED_ROOTS.some((root) => matchesRoot(hostname, root))) {
    return "Este domínio pertence à plataforma e não pode ser usado.";
  }
  return null;
}

/** Parses `PLATFORM_HOSTS` env (comma separated, `*.` wildcards allowed). */
export function parsePlatformHosts(value: string | undefined): string[] {
  const list = (value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  return list.length > 0 ? list : DEFAULT_PLATFORM_HOSTS;
}

/** True when the request host is the platform (not a tenant's custom domain). */
export function isPlatformHost(host: string, platformHosts: string[] = DEFAULT_PLATFORM_HOSTS): boolean {
  if (!host) return true; // no Host header: never treat as a tenant domain
  return platformHosts.some((entry) =>
    entry.startsWith("*.") ? host.endsWith(entry.slice(1)) : host === entry
  );
}
