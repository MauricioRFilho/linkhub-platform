"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, TicketPercent } from "lucide-react";
import { trackBlock } from "@/lib/analytics/track";
import type { CouponConfig } from "@/lib/blocks/config";

interface CouponBlockProps {
  id: string;
  title: string;
  subtitle: string | null;
  url: string | null;
  config: CouponConfig;
  index: number;
}

/**
 * Discount coupon with one-tap copy. Copy events are tracked separately from
 * clicks so creators can measure coupon adoption.
 */
export default function CouponBlock({ id, title, subtitle, url, config, index }: CouponBlockProps) {
  const [copied, setCopied] = useState(false);
  const validUntil = config.validUntil
    ? new Date(`${config.validUntil}T00:00:00`).toLocaleDateString("pt-BR")
    : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(config.code);
      setCopied(true);
      trackBlock(id, "copy");
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the code stays visible for manual copy */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      className="block-coupon relative w-full rounded-2xl border-2 border-dashed border-accent/60 bg-bg-card px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <TicketPercent size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text truncate">{title}</p>
          <p className="text-xs text-text-muted truncate">
            {[config.discount, subtitle, validUntil && `válido até ${validUntil}`].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copiar cupom ${config.code}`}
          className="group flex flex-1 items-center justify-between rounded-xl bg-bg px-3 py-2 font-mono text-sm font-bold tracking-widest text-text transition-colors hover:bg-bg-hover"
        >
          {config.code}
          <span className="flex items-center gap-1 font-sans text-xs font-medium tracking-normal text-accent">
            {copied ? <><Check size={14} />Copiado!</> : <><Copy size={14} />Copiar</>}
          </span>
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBlock(id)}
            className="rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            Usar
          </a>
        )}
      </div>
      <span className="sr-only" aria-live="polite">{copied ? "Cupom copiado" : ""}</span>
    </motion.div>
  );
}
