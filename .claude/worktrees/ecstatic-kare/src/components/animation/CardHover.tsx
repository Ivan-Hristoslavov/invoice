"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface CardHoverProps {
  children: ReactNode;
  delay?: number;
}

export function CardHover({ children, delay = 0 }: CardHoverProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: delay
        }
      }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.07)",
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 10
        }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
} 