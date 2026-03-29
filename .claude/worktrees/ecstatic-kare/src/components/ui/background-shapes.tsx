"use client";

interface BackgroundShapesProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
  reduceEffects?: boolean;
}

export function BackgroundShapes({
  variant = "default",
  className = "",
  reduceEffects = false,
}: BackgroundShapesProps) {
  const intensity = variant === "subtle" ? 1.2 : variant === "vibrant" ? 1.8 : 1.5;
  const showShapes = variant === "vibrant" && !reduceEffects;
  const orbBlurClass = reduceEffects ? "blur-2xl" : "blur-3xl";
  const orbOpacityClass = reduceEffects ? "opacity-55 dark:opacity-65" : "opacity-90 dark:opacity-100";

  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient - more transparent for light mode */}
      <div className="absolute inset-0 bg-linear-to-br from-slate-50/80 via-white/60 to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      
      {/* Large vibrant gradient orbs - more visible in light mode */}
      {/* Purple/Violet - top right */}
      <div
        className={`absolute top-[-20%] right-[-10%] h-[70vw] w-[70vw] max-h-[1000px] max-w-[1000px] rounded-full ${orbBlurClass} ${orbOpacityClass}`}
        style={{
          background: `radial-gradient(circle, rgba(168, 85, 247, ${0.55 * intensity}) 0%, rgba(139, 92, 246, ${0.45 * intensity}) 40%, transparent 70%)`,
        }}
      />
      
      {/* Cyan/Teal - bottom left */}
      <div
        className={`absolute bottom-[-10%] left-[-10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full ${orbBlurClass} ${orbOpacityClass}`}
        style={{
          background: `radial-gradient(circle, rgba(6, 182, 212, ${0.55 * intensity}) 0%, rgba(34, 211, 238, ${0.4 * intensity}) 40%, transparent 70%)`,
        }}
      />
      
      {/* Pink/Rose - center */}
      <div
        className={`absolute top-[40%] left-[30%] h-[50vw] w-[50vw] max-h-[700px] max-w-[700px] rounded-full ${reduceEffects ? "blur-2xl opacity-45 dark:opacity-55" : "blur-3xl opacity-80 dark:opacity-100"}`}
        style={{
          background: `radial-gradient(circle, rgba(236, 72, 153, ${0.45 * intensity}) 0%, rgba(244, 114, 182, ${0.35 * intensity}) 40%, transparent 70%)`,
        }}
      />

      {/* Blue/Indigo - top center */}
      <div
        className={`absolute top-[10%] left-[50%] h-[40vw] w-[40vw] max-h-[600px] max-w-[600px] rounded-full ${reduceEffects ? "blur-2xl opacity-45 dark:opacity-55" : "blur-3xl opacity-80 dark:opacity-100"}`}
        style={{
          background: `radial-gradient(circle, rgba(59, 130, 246, ${0.45 * intensity}) 0%, rgba(99, 102, 241, ${0.3 * intensity}) 40%, transparent 70%)`,
        }}
      />

      {/* Green/Emerald - bottom right accent */}
      <div
        className={`absolute bottom-[20%] right-[30%] h-[30vw] w-[30vw] max-h-[400px] max-w-[400px] rounded-full ${reduceEffects ? "blur-2xl opacity-40 dark:opacity-50" : "blur-3xl opacity-70 dark:opacity-80"}`}
        style={{
          background: `radial-gradient(circle, rgba(16, 185, 129, ${0.4 * intensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Orange/Amber - extra accent */}
      <div
        className={`absolute top-[60%] right-[5%] h-[25vw] w-[25vw] max-h-[350px] max-w-[350px] rounded-full ${reduceEffects ? "hidden" : "blur-3xl opacity-70 dark:opacity-70"}`}
        style={{
          background: `radial-gradient(circle, rgba(251, 146, 60, ${0.35 * intensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Floating geometric shapes - only for vibrant variant */}
      {showShapes && (
        <>
          {/* Floating circle - top left - large and blurred */}
          <div className="animate-orb-float-slow absolute top-[15%] left-[10%] h-32 w-32 rounded-full bg-emerald-500/10 blur-xl dark:bg-emerald-400/10" />

          {/* Floating square - top right - blurred */}
          <div className="animate-orb-float-diagonal absolute top-[20%] right-[15%] h-24 w-24 rounded-2xl bg-purple-500/10 blur-xl dark:bg-purple-400/10" />

          {/* Floating blob - center left - very blurred */}
          <div className="animate-orb-float-slower absolute top-[45%] left-[5%] h-40 w-40 rounded-full bg-cyan-500/8 blur-2xl dark:bg-cyan-400/8" />

          {/* Floating diamond shape - bottom left - blurred */}
          <div className="animate-orb-float-reverse absolute bottom-[25%] left-[20%] h-28 w-28 rotate-45 rounded-3xl bg-pink-500/8 blur-xl dark:bg-pink-400/8" />

          {/* Floating ring - center right - large and blurred */}
          <div className="animate-orb-float-slower absolute top-[35%] right-[8%] h-36 w-36 rounded-full bg-blue-500/8 blur-2xl dark:bg-blue-400/8" />

          {/* Medium floating blobs */}
          <div className="animate-orb-float-diagonal absolute top-[60%] left-[15%] h-20 w-20 rounded-full bg-emerald-500/10 blur-xl dark:bg-emerald-400/10" />
          <div className="animate-orb-float-reverse absolute top-[25%] left-[40%] h-16 w-16 rounded-full bg-purple-500/10 blur-xl dark:bg-purple-400/10" />
          <div className="animate-orb-float-diagonal absolute bottom-[35%] right-[25%] h-24 w-24 rounded-full bg-cyan-500/10 blur-xl dark:bg-cyan-400/10" />

          {/* Floating elongated shape - blurred */}
          <div className="animate-orb-sway absolute top-[70%] right-[40%] h-12 w-32 rounded-full bg-linear-to-r from-amber-500/8 via-orange-500/10 to-amber-500/8 blur-xl" />

          {/* Cross/Plus shape - blurred */}
          <div className="animate-orb-rotate absolute bottom-[40%] left-[35%] blur-lg">
            <div className="w-16 h-4 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full" />
            <div className="w-4 h-16 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Extra floating orbs for depth */}
          <div className="animate-orb-float-reverse absolute top-[80%] left-[60%] h-20 w-20 rounded-full bg-rose-500/8 blur-2xl dark:bg-rose-400/8" />
          <div className="animate-orb-float-slow absolute top-[10%] left-[60%] h-28 w-28 rounded-full bg-teal-500/8 blur-2xl dark:bg-teal-400/8" />
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
