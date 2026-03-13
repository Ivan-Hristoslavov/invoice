"use client";

import { motion } from "framer-motion";

interface BackgroundShapesProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
}

export function BackgroundShapes({ variant = "default", className = "" }: BackgroundShapesProps) {
  const intensity = variant === "subtle" ? 1.2 : variant === "vibrant" ? 1.8 : 1.5;
  const showShapes = variant === "vibrant";

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient - more transparent for light mode */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-50/80 via-white/60 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Large vibrant gradient orbs - more visible in light mode */}
      {/* Purple/Violet - top right */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] max-w-[1000px] max-h-[1000px] rounded-full blur-3xl opacity-90 dark:opacity-100"
        style={{
          background: `radial-gradient(circle, rgba(168, 85, 247, ${0.55 * intensity}) 0%, rgba(139, 92, 246, ${0.45 * intensity}) 40%, transparent 70%)`,
        }}
      />
      
      {/* Cyan/Teal - bottom left */}
      <div
        className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full blur-3xl opacity-90 dark:opacity-100"
        style={{
          background: `radial-gradient(circle, rgba(6, 182, 212, ${0.55 * intensity}) 0%, rgba(34, 211, 238, ${0.4 * intensity}) 40%, transparent 70%)`,
        }}
      />
      
      {/* Pink/Rose - center */}
      <div
        className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full blur-3xl opacity-80 dark:opacity-100"
        style={{
          background: `radial-gradient(circle, rgba(236, 72, 153, ${0.45 * intensity}) 0%, rgba(244, 114, 182, ${0.35 * intensity}) 40%, transparent 70%)`,
        }}
      />

      {/* Blue/Indigo - top center */}
      <div
        className="absolute top-[10%] left-[50%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full blur-3xl opacity-80 dark:opacity-100"
        style={{
          background: `radial-gradient(circle, rgba(59, 130, 246, ${0.45 * intensity}) 0%, rgba(99, 102, 241, ${0.3 * intensity}) 40%, transparent 70%)`,
        }}
      />

      {/* Green/Emerald - bottom right accent */}
      <div
        className="absolute bottom-[20%] right-[30%] w-[30vw] h-[30vw] max-w-[400px] max-h-[400px] rounded-full blur-3xl opacity-70 dark:opacity-80"
        style={{
          background: `radial-gradient(circle, rgba(16, 185, 129, ${0.4 * intensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Orange/Amber - extra accent */}
      <div
        className="absolute top-[60%] right-[5%] w-[25vw] h-[25vw] max-w-[350px] max-h-[350px] rounded-full blur-3xl opacity-70 dark:opacity-70"
        style={{
          background: `radial-gradient(circle, rgba(251, 146, 60, ${0.35 * intensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Floating geometric shapes - only for vibrant variant */}
      {showShapes && (
        <>
          {/* Floating circle - top left - large and blurred */}
          <motion.div
            className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 blur-xl"
            animate={{
              y: [0, -50, 0],
              x: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating square - top right - blurred */}
          <motion.div
            className="absolute top-[20%] right-[15%] w-24 h-24 bg-purple-500/10 dark:bg-purple-400/10 rounded-2xl blur-xl"
            animate={{
              y: [0, 40, 0],
              x: [0, -20, 0],
              rotate: [0, 45, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating blob - center left - very blurred */}
          <motion.div
            className="absolute top-[45%] left-[5%] w-40 h-40 bg-cyan-500/8 dark:bg-cyan-400/8 rounded-full blur-2xl"
            animate={{
              y: [0, -30, 0],
              x: [0, 25, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating diamond shape - bottom left - blurred */}
          <motion.div
            className="absolute bottom-[25%] left-[20%] w-28 h-28 bg-pink-500/8 dark:bg-pink-400/8 rounded-3xl rotate-45 blur-xl"
            animate={{
              y: [0, 35, 0],
              x: [0, -15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating ring - center right - large and blurred */}
          <motion.div
            className="absolute top-[35%] right-[8%] w-36 h-36 rounded-full bg-blue-500/8 dark:bg-blue-400/8 blur-2xl"
            animate={{
              y: [0, -45, 0],
              x: [0, -20, 0],
              scale: [1, 0.85, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Medium floating blobs */}
          <motion.div
            className="absolute top-[60%] left-[15%] w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 blur-xl"
            animate={{
              y: [0, -25, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-[25%] left-[40%] w-16 h-16 rounded-full bg-purple-500/10 dark:bg-purple-400/10 blur-xl"
            animate={{
              y: [0, 30, 0],
              x: [0, -25, 0],
            }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-[35%] right-[25%] w-24 h-24 rounded-full bg-cyan-500/10 dark:bg-cyan-400/10 blur-xl"
            animate={{
              y: [0, -35, 0],
              x: [0, 15, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Floating elongated shape - blurred */}
          <motion.div
            className="absolute top-[70%] right-[40%] w-32 h-12 bg-linear-to-r from-amber-500/8 via-orange-500/10 to-amber-500/8 rounded-full blur-xl"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Cross/Plus shape - blurred */}
          <motion.div
            className="absolute bottom-[40%] left-[35%] blur-lg"
            animate={{
              rotate: [0, 90, 0],
              scale: [1, 0.8, 1],
              y: [0, 20, 0],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-16 h-4 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full" />
            <div className="w-4 h-16 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </motion.div>

          {/* Extra floating orbs for depth */}
          <motion.div
            className="absolute top-[80%] left-[60%] w-20 h-20 rounded-full bg-rose-500/8 dark:bg-rose-400/8 blur-2xl"
            animate={{
              y: [0, -40, 0],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 26,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-[10%] left-[60%] w-28 h-28 rounded-full bg-teal-500/8 dark:bg-teal-400/8 blur-2xl"
            animate={{
              y: [0, 35, 0],
              x: [0, 20, 0],
            }}
            transition={{
              duration: 28,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}
    </div>
  );
}

// Simpler version for pages that need minimal decoration
export function BackgroundGradient({ className = "" }: { className?: string }) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-size-[64px_64px]" />
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
