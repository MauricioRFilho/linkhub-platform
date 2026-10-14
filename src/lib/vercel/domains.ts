/**
 * Vercel REST API client for dynamic custom domains.
 *
 * Why: when a tenant proves ownership of their domain, we register it on
 * the Vercel project so Vercel can provision TLS certificates and route traffic.
 * Uses VERCEL_TOKEN and VERCEL_PROJECT_ID from server environment variables.
 * @see docs/vercel.md
 */

const VERCEL_API_BASE = "https://api.vercel.com";

interface VercelDomainResponse {
  name: string;
  apexName?: string;
  verified: boolean;
  misconfigured?: boolean;
}

interface VercelDomainConfigResponse {
  configuredBy?: "CNAME" | "A" | "http-01" | "dns-01" | null;
  acceptedChallenges?: string[];
  misconfigured: boolean;
}

function getVercelCredentials() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME;

  return { token, projectId };
}

async function vercelFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { token } = getVercelCredentials();
  if (!token) {
    throw new Error("VERCEL_TOKEN não configurado no servidor.");
  }

  const res = await fetch(`${VERCEL_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Vercel API error (${res.status}): ${errorText}`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.error?.message || message;
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/**
 * Adds a custom domain to the Vercel project.
 * Optionally configure a redirect target (e.g. redirect www -> apex).
 */
export async function addDomainToVercel(
  domain: string,
  redirectTarget?: string
): Promise<VercelDomainResponse> {
  const { projectId } = getVercelCredentials();
  if (!projectId) {
    console.warn("VERCEL_PROJECT_ID não definido. Pulando registro na Vercel.");
    return { name: domain, verified: false };
  }

  try {
    const body: Record<string, unknown> = { name: domain };
    if (redirectTarget) {
      body.redirect = redirectTarget;
      body.redirectStatusCode = 308;
    }

    return await vercelFetch<VercelDomainResponse>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists") || msg.includes("409")) {
      return { name: domain, verified: false };
    }
    throw err;
  }
}

/**
 * Checks verification and TLS/DNS configuration status of a domain on Vercel.
 */
export async function checkVercelDomain(domain: string): Promise<{
  verified: boolean;
  misconfigured: boolean;
}> {
  const { projectId } = getVercelCredentials();
  if (!projectId) {
    return { verified: false, misconfigured: false };
  }

  let verified = false;
  let misconfigured = false;

  try {
    const verifyRes = await vercelFetch<VercelDomainResponse>(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}/verify`,
      { method: "POST" }
    );
    verified = !!verifyRes.verified;
  } catch {
    // If verify POST fails, try GET domain
    try {
      const getRes = await vercelFetch<VercelDomainResponse>(
        `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`
      );
      verified = !!getRes.verified;
    } catch {
      verified = false;
    }
  }

  try {
    const configRes = await vercelFetch<VercelDomainConfigResponse>(
      `/v6/domains/${encodeURIComponent(domain)}/config`
    );
    misconfigured = !!configRes.misconfigured;
  } catch {
    // fallback
  }

  return { verified, misconfigured };
}

/**
 * Removes a domain and its www alias from the Vercel project.
 */
export async function removeDomainFromVercel(domain: string): Promise<boolean> {
  const { projectId } = getVercelCredentials();
  if (!projectId) return true;

  try {
    await vercelFetch(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(domain)}`,
      { method: "DELETE" }
    );
  } catch {
    // ignore if doesn't exist
  }

  // Also try removing www
  try {
    await vercelFetch(
      `/v9/projects/${encodeURIComponent(projectId)}/domains/${encodeURIComponent(`www.${domain}`)}`,
      { method: "DELETE" }
    );
  } catch {
    // ignore
  }

  return true;
}
