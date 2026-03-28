"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Леко влизане на публични страници (about, contact, …) — уважава „намали движение“.
 */
export function PublicPageFrame({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <motion.div
      className="min-h-screen"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
