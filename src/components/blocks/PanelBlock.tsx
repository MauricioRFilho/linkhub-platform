"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { PanelLayout } from "@/types/database";
import { remainingLabel } from "@/lib/blocks/schedule";

interface PanelBlockProps {
  title: string;
  subtitle: string | null;
  layout: PanelLayout;
  endsAt: string | null;
  showCountdown: boolean;
  index: number;
  children: ReactNode[];
}

const LAYOUT_CLASS: Record<PanelLayout, string> = {
  list: "flex flex-col gap-2.5",
  grid: "grid grid-cols-1 sm:grid-cols-2 gap-2.5",
  carousel: "panel-carousel -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2",
  spotlight: "flex flex-col gap-2.5",
};

/** Countdown computed after mount to avoid server/client clock mismatch. */
function Countdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setLabel(remainingLabel(endsAt));
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 30_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [endsAt]);
  if (!label) return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-accent">
      <Clock size={12} /> termina em {label}
    </span>
  );
}

/**
 * Groups blocks (e.g. "Achado da semana": product + coupon + communities)
 * with a creator-chosen layout.
 */
export default function PanelBlock({ title, subtitle, layout, endsAt, showCountdown, index, children }: PanelBlockProps) {
  const spotlight = layout === "spotlight";
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
      aria-label={title}
      className={`w-full ${spotlight ? "panel-spotlight relative rounded-3xl border border-accent/40 bg-bg-card/60 p-4" : "py-1"}`}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <h2 className={`font-semibold text-text ${spotlight ? "text-base" : "text-xs uppercase tracking-widest text-text-muted"}`}>{title}</h2>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
        {showCountdown && endsAt && <Countdown endsAt={endsAt} />}
      </header>
      <div className={LAYOUT_CLASS[layout]}>
        {layout === "carousel"
          ? children.map((child, i) => <div key={i} className="w-[85%] shrink-0 snap-start">{child}</div>)
          : children}
      </div>
    </motion.section>
  );
}
