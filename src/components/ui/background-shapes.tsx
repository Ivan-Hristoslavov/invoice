"use client";

import { motion } from "framer-motion";

interface BackgroundShapesProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
}

export function BackgroundShapes({ variant = "default", className = "" }: BackgroundShapesProps) {
  const intensity = variant === "subtle" ? 0.3 : variant === "vibrant" ? 1 : 0.5;

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:48px_48px]" />
      
      {/* Animated gradient orbs */}
      <motion.div
        className="absolute -top-[30%] -right-[15%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(6, 182, 212, ${0.08 * intensity}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute -bottom-[20%] -left-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(99, 102, 241, ${0.06 * intensity}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          x: [0, -40, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] max-w-[500px] max-h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(34, 211, 238, ${0.05 * intensity}) 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-[15%] left-[10%] w-16 h-16 rounded-2xl border border-cyan-500/10 dark:border-cyan-400/10"
        style={{ backdropFilter: "blur(2px)" }}
        animate={{
          rotate: [0, 90, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute top-[60%] right-[8%] w-12 h-12 rounded-full border border-indigo-500/10 dark:border-indigo-400/10"
        animate={{
          scale: [1, 1.2, 1],
          y: [0, 15, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-[20%] left-[20%] w-20 h-20 rounded-3xl border border-cyan-500/8 dark:border-cyan-400/8"
        animate={{
          rotate: [0, -45, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute top-[35%] right-[25%] w-8 h-8 rounded-lg bg-cyan-500/5 dark:bg-cyan-400/5"
        animate={{
          y: [0, -25, 0],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-[35%] right-[15%] w-6 h-6 rounded-full bg-indigo-500/5 dark:bg-indigo-400/5"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Dot pattern accents */}
      <div className="absolute top-[10%] right-[30%] grid grid-cols-3 gap-2 opacity-20">
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-cyan-500/30 dark:bg-cyan-400/30"
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="absolute bottom-[15%] left-[35%] grid grid-cols-4 gap-1.5 opacity-15">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full bg-indigo-500/30 dark:bg-indigo-400/30"
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Gradient lines */}
      <motion.div
        className="absolute top-[25%] left-0 w-full h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, ${0.1 * intensity}) 50%, transparent 100%)`,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.div
        className="absolute bottom-[30%] left-0 w-full h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, ${0.08 * intensity}) 50%, transparent 100%)`,
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scaleX: [0.9, 1, 0.9],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}

// Simpler version for pages that need minimal decoration
export function BackgroundGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div 
        className="absolute -top-[40%] -right-[20%] w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(6, 182, 212, 0.04) 0%, transparent 70%)",
        }}
      />
      <div 
        className="absolute -bottom-[30%] -left-[15%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full opacity-60"
        style={{
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.03) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
