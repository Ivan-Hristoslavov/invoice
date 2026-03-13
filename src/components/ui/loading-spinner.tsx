"use client";

import { FileText, Loader2 } from "lucide-react";
import { APP_NAME } from "@/config/constants";

export function LoadingSpinner({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
  const sizeMap = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className={`flex justify-center items-center ${className || ""}`}>
      <Loader2 className={`animate-spin ${sizeMap[size]}`} />
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/95 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_38%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.14),transparent_34%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border/60 bg-background/90 p-8 text-center shadow-2xl">
          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-cyan-500 via-emerald-500 to-blue-500" />

          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute h-24 w-24 animate-ping rounded-full bg-primary/10 animation-duration-[2.4s]" />
            <div className="absolute h-20 w-20 rounded-full border border-primary/15" />
            <div className="absolute h-16 w-16 animate-spin rounded-full border-2 border-primary/15 border-t-primary animation-duration-[1.4s]" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary shadow-lg shadow-primary/20">
              <FileText className="h-7 w-7 text-white" />
            </div>
          </div>

          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
            {APP_NAME}
          </div>
          <h2 className="mb-2 text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mx-auto max-w-xs text-sm leading-6 text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary/80 [animation-delay:-0.1s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60" />
          </div>
        </div>
      </div>
    </div>
  );
} 