"use client";

import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";
import { SessionLoader } from "@/components/layout/SessionLoader";

export function AuthProvider({ children }: PropsWithChildren) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <SessionLoader>{children}</SessionLoader>
    </SessionProvider>
  );
} 