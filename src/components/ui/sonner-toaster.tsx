"use client";

import { Toast } from "@heroui/react";

export function Toaster() {
  return (
    <Toast.Provider
      placement="top end"
      gap={10}
      maxVisibleToasts={4}
      className="z-75 pt-[calc(env(safe-area-inset-top)+3.75rem)] pr-[calc(env(safe-area-inset-right)+0.75rem)] pl-3 sm:pt-[calc(env(safe-area-inset-top)+4.5rem)] sm:pl-0"
      width="min(420px, calc(100vw - 1rem - env(safe-area-inset-left) - env(safe-area-inset-right)))"
    />
  );
}
