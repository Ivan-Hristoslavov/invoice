"use client";

import { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { Spinner } from "@heroui/react";
import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";

/**
 * @see https://heroui.com/docs/react/components/spinner
 */
export function LoadingSpinner({
  className,
  size = "medium",
}: {
  className?: string;
  size?: "small" | "medium" | "large";
}) {
  const sizeMap = {
    small: "sm",
    medium: "md",
    large: "lg",
  } as const;

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Spinner size={sizeMap[size]} color="accent" />
    </div>
  );
}

export function FullPageLoader({
  title = "Зареждане",
  subtitle = "Подготвяме съдържанието за вас...",
}: {
  title?: string;
  subtitle?: string;
}) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    function tick() {
      const elapsed = Date.now() - startRef.current;
      setProgress((prev) => {
        const target = 92;
        const timeBased = Math.min(target, (elapsed / 5000) * target);
        const decel = prev + Math.max(0.12, (target - prev) * 0.006);
        return Math.min(target, Math.max(decel, timeBased));
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Базов wash */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(20,184,166,0.12),transparent_50%),radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(59,130,246,0.08),transparent_45%)] motion-safe:animate-loading-ambient-drift"
        aria-hidden
      />

      {/* Мек „мъгляв“ слой — усещане за движение */}
      <div
        className="pointer-events-none absolute inset-[-15%] bg-[radial-gradient(ellipse_80%_50%_at_50%_45%,rgba(45,212,191,0.14),transparent_55%)] motion-safe:animate-loading-ambient-drift"
        style={{ animationDelay: "-2s" }}
        aria-hidden
      />

      {/* Пулсиращи ореоли */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[36%] h-[min(92vmin,520px)] w-[min(92vmin,520px)] -translate-x-1/2 -translate-y-1/2">
          <div className="h-full w-full rounded-full bg-emerald-400/35 blur-[88px] motion-safe:animate-loading-bg-pulse dark:bg-emerald-500/40" />
        </div>
        <div className="absolute bottom-[-8%] left-1/2 h-[42vmin] w-[min(96vw,640px)] -translate-x-1/2">
          <div className="h-full w-full rounded-[100%] bg-cyan-400/25 blur-[72px] motion-safe:animate-loading-bg-pulse-soft dark:bg-cyan-500/30" />
        </div>
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8 sm:gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative flex h-22 w-22 items-center justify-center" aria-hidden>
            <div
              className="pointer-events-none absolute inset-[-55%] rounded-full bg-linear-to-br from-emerald-400/55 via-cyan-400/45 to-teal-500/50 blur-xl motion-safe:animate-loader-icon-halo dark:from-emerald-500/50 dark:via-cyan-500/45 dark:to-teal-500/55"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-[-28%] rounded-full bg-linear-to-tl from-cyan-300/50 via-emerald-400/40 to-transparent blur-md motion-safe:animate-loader-icon-halo-soft dark:from-cyan-400/45 dark:via-emerald-500/35"
              aria-hidden
            />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-primary/30 ring-2 ring-white/10 motion-safe:animate-loader-card-breathe">
              <FileText className="h-10 w-10 text-white" aria-hidden />
            </div>
          </div>
        </div>

        <div className="max-w-md space-y-4 text-center motion-safe:animate-loader-content-rise">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.32em] text-primary/85">{APP_NAME}</p>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{subtitle}</p>

          <div className="mx-auto w-full max-w-[260px] space-y-2.5 pt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm shadow-primary/40"
                style={{
                  width: `${progress}%`,
                  transition: "width 80ms linear",
                }}
              />
            </div>
            <p className="text-center text-xs font-medium tabular-nums text-muted-foreground/80">
              {Math.round(progress)}%
            </p>
          </div>
          <span className="sr-only">
            {title}. {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline progressive loader that stays mounted, finishes 0→100%, then reveals children.
 *
 * Usage:
 *   <ContentLoader loading={isLoadingData} title="…">
 *     <ActualContent />
 *   </ContentLoader>
 *
 * The bar crawls toward ~70% while `loading` is true.
 * When `loading` flips to false the bar accelerates to 100%, then fades out.
 */
export function ContentLoader({
  loading,
  title = "Зареждане",
  subtitle,
  children,
  className,
}: {
  loading: boolean;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "finishing" | "done">("loading");
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());
  const loadedAtRef = useRef<number | null>(null);

  // When loading flips to false, start finishing phase
  useEffect(() => {
    if (!loading && phase === "loading") {
      loadedAtRef.current = Date.now();
      setPhase("finishing");
    }
  }, [loading, phase]);

  useEffect(() => {
    if (phase === "done") return;

    startRef.current = Date.now();

    function tick() {
      setProgress((prev) => {
        if (phase === "done") return 100;

        if (phase === "finishing" || !loading) {
          // Fast ramp to 100
          const next = prev + (100 - prev) * 0.18;
          if (next >= 99.5) {
            return 100;
          }
          return next;
        }

        // Slow crawl: realistic ramp toward ~70%
        const elapsed = Date.now() - startRef.current;
        const target = 70;
        // Time-based linear + slight deceleration
        const timeBased = Math.min(target, (elapsed / 4000) * target);
        const decel = prev + Math.max(0.15, (target - prev) * 0.008);
        return Math.min(target, Math.max(decel, timeBased));
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loading, phase]);

  // Transition from finishing → done once bar hits 100
  useEffect(() => {
    if (phase === "finishing" && progress >= 100) {
      const t = setTimeout(() => setPhase("done"), 250);
      return () => clearTimeout(t);
    }
  }, [phase, progress]);

  if (phase === "done") {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl border border-border/40 bg-muted/20 py-16 px-6",
        phase === "finishing" && progress >= 100 && "animate-out fade-out duration-200",
        className
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <div
          className="absolute inset-[-30%] rounded-full bg-primary/10 blur-md motion-safe:animate-pulse"
          aria-hidden
        />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/20">
          <FileText className="h-6 w-6 text-white" aria-hidden />
        </div>
      </div>

      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="w-full max-w-[240px] space-y-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-sm shadow-primary/30"
            style={{
              width: `${progress}%`,
              transition: "width 80ms linear",
            }}
          />
        </div>
        <p className="text-center text-[11px] font-medium tabular-nums text-muted-foreground/80">
          {Math.round(progress)}%
        </p>
      </div>

      <span className="sr-only">
        {title} — {Math.round(progress)}%
      </span>
    </div>
  );
}
