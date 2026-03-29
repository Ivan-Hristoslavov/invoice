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
    <div className="fixed inset-0 z-50 overflow-hidden bg-background/95 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_38%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.14),transparent_34%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary shadow-xl shadow-primary/25">
            <FileText className="h-10 w-10 text-white" aria-hidden />
          </div>
          <Spinner size="lg" color="accent" className="scale-110" />
        </div>
        <div className="max-w-md text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">{APP_NAME}</p>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
