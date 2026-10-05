"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { safeImageSource } from "@/lib/utils/public-url";

interface AvatarProps {
  src: string | null;
  name: string;
  verified: boolean;
  accentColor: string;
}

/** Circular avatar with animated ring and optional verified badge */
export default function Avatar({ src, name, verified, accentColor }: AvatarProps) {
  const imageSource = safeImageSource(src);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="public-profile-avatar relative w-24 h-24"
    >
      {/* Animated ring — color driven by theme accent */}
      <div
        className="absolute inset-0 rounded-full avatar-ring"
        style={{
          background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}10)`,
        }}
      />

      {/* Avatar image */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-border ring-offset-2 ring-offset-bg">
        {imageSource ? (
          <Image src={imageSource} alt={name} fill className="object-cover" sizes="96px" priority unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-card text-3xl font-semibold text-accent" aria-label={`Avatar de ${name}`}>
            {name.trim().charAt(0).toUpperCase() || "?"}
          </div>
        )}
      </div>

      {/* Verified badge */}
      {verified && (
        <div
          className="badge-verified"
          style={{ background: accentColor }}
          aria-label="Verificado"
        >
          <Check size={12} strokeWidth={3} />
        </div>
      )}
    </motion.div>
  );
}
