"use client";

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

          <div
            className="mx-auto h-0.5 max-w-[160px] rounded-full motion-safe:animate-loader-shimmer-line"
            style={{
              backgroundImage:
                "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.85), transparent)",
              backgroundSize: "220% 100%",
            }}
            aria-hidden
          />

          <div className="flex justify-center gap-1.5 pt-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-primary/80 motion-safe:animate-loader-dot-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          <div className="mx-auto h-1 w-full max-w-[220px] overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full w-[38%] rounded-full bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400 motion-safe:animate-loader-indeterminate shadow-sm shadow-primary/40"
              aria-hidden
            />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/90">
            Моля, изчакайте
          </p>
          <span className="sr-only">
            {title}. {subtitle}
          </span>
        </div>
      </div>
    </div>
  );
}
