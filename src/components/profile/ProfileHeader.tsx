"use client";

import { motion } from "framer-motion";

interface ProfileHeaderProps {
  name: string;
  bio: string;
}

/** Creator name and bio — strong typography, minimal */
export default function ProfileHeader({ name, bio }: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="text-center mt-4"
    >
      <h1 className="text-xl font-bold text-text tracking-tight">{name}</h1>
      <p className="text-sm text-text-muted mt-1.5 max-w-[300px] mx-auto leading-relaxed">
        {bio}
      </p>
    </motion.div>
  );
}
