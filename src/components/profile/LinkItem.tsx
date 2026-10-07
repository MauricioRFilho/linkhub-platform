"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { safeImageSource } from "@/lib/utils/public-url";

interface LinkItemProps {
  title: string;
  subtitle: string | null;
  url: string;
  emoji: string | null;
  thumbnail: string | null;
  index: number;
  accentColor: string;
  /** Analytics hook — fired before the browser follows the link. */
  onClick?: () => void;
}

/** Generic link card with optional emoji/thumbnail and subtitle */
export default function LinkItem({
  title,
  subtitle,
  url,
  emoji,
  thumbnail,
  index,
  accentColor,
  onClick,
}: LinkItemProps) {
  const isExternal = /^(https?:|mailto:|tel:)/i.test(url);
  const imageSource = safeImageSource(thumbnail);

  return (
    <motion.a
      href={url}
      onClick={onClick}
      target={isExternal ? "_blank" : "_self"}
      rel={isExternal ? "noopener noreferrer" : undefined}
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

      {/* Emoji (when no thumbnail) */}
      {!thumbnail && emoji && (
        <span className="text-lg mr-3 shrink-0 group-hover:scale-110 transition-transform duration-200">
          {emoji}
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
      </div>

      {/* Arrow */}
      {isExternal && (
        <ExternalLink
          size={14}
          className="text-text-muted opacity-0 group-hover:opacity-50 transition-opacity duration-200 shrink-0 ml-2"
        />
      )}
    </motion.a>
  );
}
