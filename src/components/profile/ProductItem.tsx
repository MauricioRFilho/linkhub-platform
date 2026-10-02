"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";

interface ProductItemProps {
  title: string;
  subtitle: string | null;
  url: string;
  store: string;
  thumbnail: string | null;
  index: number;
  accentColor: string;
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
}: ProductItemProps) {
  const storeClass = STORE_CLASS[store] || "";

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.05 }}
      className="group relative flex items-center w-full px-4 py-3.5 rounded-2xl bg-bg-card border border-border transition-all duration-200 cursor-pointer"
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = `${accentColor}30`;
        el.style.backgroundColor = "#27272a";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "";
        el.style.backgroundColor = "";
      }}
    >
      {/* Thumbnail */}
      {thumbnail && (
        <div className="relative w-10 h-10 rounded-xl overflow-hidden mr-3.5 shrink-0">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="40px"
          />
        </div>
      )}

      {/* Store badge (when no thumbnail) */}
      {!thumbnail && (
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg shrink-0 mr-3 ${storeClass}`}
        >
          {store}
        </span>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-text block truncate group-hover:text-white transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-text-muted block truncate mt-0.5">
            {subtitle}
          </span>
        )}
      </div>

      {/* Arrow */}
      <ExternalLink
        size={14}
        className="text-text-muted opacity-0 group-hover:opacity-50 transition-opacity duration-200 shrink-0 ml-2"
      />
    </motion.a>
  );
}
