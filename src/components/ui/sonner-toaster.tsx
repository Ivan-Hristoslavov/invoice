"use client";

import { Toast } from "@heroui/react";

export function Toaster() {
  return (
    <Toast.Provider
      placement="top end"
      gap={10}
      maxVisibleToasts={4}
      className="z-50"
      width={460}
    />
  );
}
