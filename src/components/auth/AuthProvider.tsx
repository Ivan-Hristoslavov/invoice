"use client";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";
import { SessionLoader } from "@/components/layout/SessionLoader";

export function AuthProvider({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <SessionLoader>{children}</SessionLoader>
    </SessionProvider>
  );
} 