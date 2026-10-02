"use client";

import { motion } from "framer-motion";

interface FooterProps {
  name: string;
}

/** Minimal branded footer */
export default function Footer({ name }: FooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="mt-auto pt-16 pb-8 text-center"
    >
      <p className="text-[11px] text-text-muted/40">
        © {new Date().getFullYear()} {name}
      </p>
    </motion.footer>
  );
}
