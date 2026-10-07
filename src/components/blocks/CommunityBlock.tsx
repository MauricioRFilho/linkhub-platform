"use client";

import { motion } from "framer-motion";
import { MessageCircle, Send, Users, Camera, PlayCircle, Music2, ArrowRight, type LucideIcon } from "lucide-react";
import { trackBlock } from "@/lib/analytics/track";
import type { CommunityConfig, CommunityPlatform } from "@/lib/blocks/config";

/** Brand color + icon per platform (lucide has no brand logos). */
export const PLATFORM_STYLE: Record<CommunityPlatform, { label: string; color: string; icon: LucideIcon }> = {
  discord: { label: "Discord", color: "#5865F2", icon: Users },
  whatsapp: { label: "WhatsApp", color: "#25D366", icon: MessageCircle },
  telegram: { label: "Telegram", color: "#229ED9", icon: Send },
  instagram: { label: "Instagram", color: "#E1306C", icon: Camera },
  youtube: { label: "YouTube", color: "#FF0000", icon: PlayCircle },
  tiktok: { label: "TikTok", color: "#EE1D52", icon: Music2 },
  other: { label: "Comunidade", color: "#8b5cf6", icon: Users },
};

interface CommunityBlockProps {
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
  config: CommunityConfig;
  index: number;
}

/** Highlighted call-to-action for joining a community channel. */
export default function CommunityBlock({ id, title, subtitle, url, config, index }: CommunityBlockProps) {
  const style = PLATFORM_STYLE[config.platform];
  const Icon = style.icon;
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackBlock(id)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      className="block-community group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-border bg-bg-card px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ "--brand": style.color } as React.CSSProperties}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: style.color }}>
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text">{title}</span>
        <span className="block truncate text-xs text-text-muted">
          {[style.label, config.members && `${config.members} membros`, subtitle].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition-transform group-hover:translate-x-0.5" style={{ background: style.color }}>
        {config.cta ?? "Entrar"}
        <ArrowRight size={12} />
      </span>
    </motion.a>
  );
}
