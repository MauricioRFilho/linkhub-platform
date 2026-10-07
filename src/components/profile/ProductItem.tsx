"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { safeImageSource } from "@/lib/utils/public-url";

interface ProductItemProps {
  title: string;
  subtitle: string | null;
  url: string;
  store: string;
  thumbnail: string | null;
  index: number;
  accentColor: string;
  price?: string;
  oldPrice?: string;
  badge?: string;
  /** Analytics hook — fired before the browser follows the link. */
  onClick?: () => void;
}

/** Store badge class mapping */
const STORE_CLASS: Record<string, string> = {
  shopee: "store-shopee",
  amazon: "store-amazon",
  mercadolivre: "store-mercadolivre",
};

/** Product recommendation card with store badge */
export default function ProductItem({
  title,
  subtitle,
  url,
  store,
  thumbnail,
  index,
  accentColor,
  price,
  oldPrice,
  badge,
  onClick,
}: ProductItemProps) {
  const storeClass = STORE_CLASS[store] || "";
  const imageSource = safeImageSource(thumbnail);

  return (
    <motion.a
      href={url}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      className="public-profile-link-card group relative flex items-center w-full px-4 py-3.5 rounded-2xl bg-bg-card border border-border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{ "--link-accent": accentColor } as React.CSSProperties}
    >
      {/* Thumbnail */}
      {imageSource && (
        <div className="relative w-10 h-10 rounded-xl overflow-hidden mr-3.5 shrink-0">
          <Image
            src={imageSource}
            alt={title}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        </div>
      )}

      {/* Store badge (when no thumbnail) */}
      {!imageSource && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 mr-3 ${storeClass}`}
        >
          {store}
        </span>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="public-profile-link-title text-sm font-medium text-text block truncate transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-text-muted block truncate mt-0.5">
            {subtitle}
          </span>
        )}
        {price && (
          <span className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-bold text-accent">{price}</span>
            {oldPrice && <span className="text-xs text-text-muted line-through">{oldPrice}</span>}
          </span>
        )}
      </div>

      {badge && (
        <span className="absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-black shadow">
          {badge}
        </span>
      )}

      {/* Arrow */}
      <ExternalLink
        size={14}
        className="text-text-muted opacity-0 group-hover:opacity-50 transition-opacity duration-200 shrink-0 ml-2"
      />
    </motion.a>
  );
}
