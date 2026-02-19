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
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-xl dark:group-[.toaster]:bg-zinc-900 dark:group-[.toaster]:text-gray-100 dark:group-[.toaster]:border-zinc-700",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:border-emerald-300 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-900 dark:group-[.toaster]:bg-emerald-950 dark:group-[.toaster]:border-emerald-800 dark:group-[.toaster]:text-emerald-100",
          error:
            "group-[.toaster]:border-red-300 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 dark:group-[.toaster]:bg-red-950 dark:group-[.toaster]:border-red-800 dark:group-[.toaster]:text-red-100",
          warning:
            "group-[.toaster]:border-amber-300 group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 dark:group-[.toaster]:bg-amber-950 dark:group-[.toaster]:border-amber-800 dark:group-[.toaster]:text-amber-100",
          info:
            "group-[.toaster]:border-blue-300 group-[.toaster]:bg-blue-50 group-[.toaster]:text-blue-900 dark:group-[.toaster]:bg-blue-950 dark:group-[.toaster]:border-blue-800 dark:group-[.toaster]:text-blue-100",
        },
      }}
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  );
}
