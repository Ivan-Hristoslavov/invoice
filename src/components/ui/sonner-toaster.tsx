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
            "group toast !bg-white !text-gray-900 !border !border-gray-200 !shadow-xl dark:!bg-zinc-900 dark:!text-gray-100 dark:!border-zinc-600 [&]:opacity-100",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "!bg-emerald-50 !border-emerald-300 !text-emerald-900 dark:!bg-emerald-950 dark:!border-emerald-700 dark:!text-emerald-100 [&]:opacity-100",
          error:
            "!bg-red-100 !border-red-300 !text-red-900 dark:!bg-red-950 dark:!border-red-700 dark:!text-red-100 [&]:opacity-100",
          warning:
            "!bg-amber-50 !border-amber-300 !text-amber-900 dark:!bg-amber-950 dark:!border-amber-700 dark:!text-amber-100 [&]:opacity-100",
          info:
            "!bg-blue-50 !border-blue-300 !text-blue-900 dark:!bg-blue-950 dark:!border-blue-700 dark:!text-blue-100 [&]:opacity-100",
        },
      }}
      position="top-right"
      expand={false}
      richColors
      closeButton
    />
  );
}
