"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-800 dark:group-[.toaster]:bg-emerald-950/30 dark:group-[.toaster]:text-emerald-200",
          error: "group-[.toaster]:border-red-500/30 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800 dark:group-[.toaster]:bg-red-950/30 dark:group-[.toaster]:text-red-200",
          warning: "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-800 dark:group-[.toaster]:bg-amber-950/30 dark:group-[.toaster]:text-amber-200",
          info: "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-800 dark:group-[.toaster]:bg-blue-950/30 dark:group-[.toaster]:text-blue-200",
        },
      }}
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  );
}
