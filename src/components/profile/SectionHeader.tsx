"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  index: number;
}

/** Visual divider between link groups */
export default function SectionHeader({ title, index }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
      className="flex items-center gap-3 pt-4 pb-1"
    >
      <span className="text-xs font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-border" />
    </motion.div>
  );
}
