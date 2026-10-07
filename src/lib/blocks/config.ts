/**
 * Per-type block configuration (stored in `sections.config` JSONB).
 *
 * Why: every block type has its own fields (coupon code, community platform,
 * video id…). Keeping them in a typed JSON column lets creators add new block
 * kinds without schema migrations, while these validators guarantee only safe,
 * bounded data is persisted and rendered.
 * @see supabase/migrations/20261007120000_dynamic_blocks.sql
 */
import { isSafeProfileLink } from "../utils/public-url.ts";

export const COMMUNITY_PLATFORMS = ["discord", "whatsapp", "telegram", "instagram", "youtube", "tiktok", "other"] as const;
export type CommunityPlatform = (typeof COMMUNITY_PLATFORMS)[number];

export interface ProductConfig { price?: string; oldPrice?: string; badge?: string }
export interface CouponConfig { code: string; discount?: string; validUntil?: string }
export interface CommunityConfig { platform: CommunityPlatform; members?: string; cta?: string }
export interface VideoConfig { provider: "youtube" | "tiktok"; videoId: string }
export interface TextConfig { markdown: string }

export interface BlockConfigMap {
  link: Record<string, never>;
  header: Record<string, never>;
  panel: { showCountdown?: boolean };
  product: ProductConfig;
  coupon: CouponConfig;
  community: CommunityConfig;
  video: VideoConfig;
  text: TextConfig;
}

type Raw = Record<string, unknown>;

function asObject(value: unknown): Raw {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Raw) : {};
}

function optionalText(raw: Raw, key: string, max: number): string | undefined {
  const value = raw[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) throw new Error(`O campo "${key}" aceita até ${max} caracteres.`);
  return trimmed;
}

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtube-nocookie.com"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);

/**
 * Extracts a provider + id from a pasted video URL.
 * Only allow-listed hosts are accepted so we never embed arbitrary iframes.
 */
export function parseVideoUrl(input: string): VideoConfig | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    const id = host === "youtu.be"
      ? url.pathname.slice(1)
      : url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? "";
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? { provider: "youtube", videoId: id } : null;
  }
  if (TIKTOK_HOSTS.has(host)) {
    const id = url.pathname.match(/\/video\/(\d{8,25})/)?.[1];
    return id ? { provider: "tiktok", videoId: id } : null;
  }
  return null;
}

/** Validates (and normalizes) a config before saving. Throws a user-facing message. */
export function validateConfig<T extends keyof BlockConfigMap>(type: T, input: unknown): BlockConfigMap[T] {
  const raw = asObject(input);
  switch (type) {
    case "product":
      return {
        price: optionalText(raw, "price", 30),
        oldPrice: optionalText(raw, "oldPrice", 30),
        badge: optionalText(raw, "badge", 24),
      } as BlockConfigMap[T];
    case "coupon": {
      const code = optionalText(raw, "code", 40);
      if (!code) throw new Error("Informe o código do cupom.");
      if (!/^[\p{L}\p{N}_-]+$/u.test(code)) throw new Error("O cupom deve ter apenas letras, números, - ou _.");
      const validUntil = optionalText(raw, "validUntil", 10);
      if (validUntil && !/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) throw new Error("Validade do cupom inválida.");
      return { code, discount: optionalText(raw, "discount", 30), validUntil } as BlockConfigMap[T];
    }
    case "community": {
      const platform = raw.platform as CommunityPlatform;
      if (!COMMUNITY_PLATFORMS.includes(platform)) throw new Error("Escolha a plataforma da comunidade.");
      return { platform, members: optionalText(raw, "members", 20), cta: optionalText(raw, "cta", 40) } as BlockConfigMap[T];
    }
    case "video": {
      const provider = raw.provider;
      const videoId = typeof raw.videoId === "string" ? raw.videoId : "";
      const valid = (provider === "youtube" && /^[A-Za-z0-9_-]{11}$/.test(videoId))
        || (provider === "tiktok" && /^\d{8,25}$/.test(videoId));
      if (!valid) throw new Error("Cole um link válido do YouTube ou TikTok.");
      return { provider, videoId } as BlockConfigMap[T];
    }
    case "text": {
      const markdown = optionalText(raw, "markdown", 2000);
      if (!markdown) throw new Error("Escreva o texto do bloco.");
      return { markdown } as BlockConfigMap[T];
    }
    case "panel":
      return { showCountdown: raw.showCountdown === true } as BlockConfigMap[T];
    default:
      return {} as BlockConfigMap[T];
  }
}

/**
 * Lenient reader for rendering: never throws, returns null for invalid data so
 * a corrupted row hides a single block instead of breaking the public page.
 */
export function readConfig<T extends keyof BlockConfigMap>(type: T, input: unknown): BlockConfigMap[T] | null {
  try { return validateConfig(type, input); } catch { return null; }
}

/** Block types that require a destination URL. */
export function requiresUrl(type: string): boolean {
  return type === "link" || type === "product" || type === "community";
}

/** Coupon store link is optional; other URL-bearing blocks must be safe links. */
export function validateBlockUrl(type: string, raw: string): string | null {
  const value = raw.trim();
  if (!value) {
    if (requiresUrl(type)) throw new Error("Informe uma URL para este bloco.");
    return null;
  }
  if (!isSafeProfileLink(value, type === "link" || type === "community")) {
    throw new Error("Informe uma URL válida, incluindo https://.");
  }
  return value;
}
