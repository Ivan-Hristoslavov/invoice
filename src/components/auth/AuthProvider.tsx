"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { PropsWithChildren } from "react";
import { SessionLoader } from "@/components/layout/SessionLoader";

type AuthProviderProps = PropsWithChildren<{
  /** From `getServerSession` in a server layout — avoids empty client session on first paint. */
  session?: Session | null;
}>;

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session ?? undefined}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <SessionLoader>{children}</SessionLoader>
    </SessionProvider>
  );
}