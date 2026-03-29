"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AnimatedIconProps {
  icon: LucideIcon;
  size?: number;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export function AnimatedIcon({ 
  icon: Icon, 
  size = 24, 
  color, 
  className = "",
  onClick
}: AnimatedIconProps) {
  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      whileHover={{ 
        scale: 1.1,
        transition: { type: "spring", stiffness: 400, damping: 10 }
      }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        transition: { duration: 0.3 }
      }}
      onClick={onClick}
    >
      <Icon size={size} color={color} />
    </motion.div>
  );
} 