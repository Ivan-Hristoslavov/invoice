"use client";

import { SessionProvider } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionProvider } from "@/hooks/subscription-context";
import {
  SubscriptionUsageProvider,
  type SubscriptionUsageServerHydration,
} from "@/hooks/subscription-usage-context";
import type { SubscriptionServerHydration } from "@/hooks/subscription-context";

type MainAppShellProps = {
  children: React.ReactNode;
  usageHydration: SubscriptionUsageServerHydration | null;
  subscriptionHydration: SubscriptionServerHydration | null;
};

/**
 * Ensures `useSession` (used by subscription hooks) sits under `SessionProvider` within the (main) tree.
 * Root layout also provides SessionProvider; nesting matches next-auth guidance for route-group client shells.
 */
export function MainAppShell({
  children,
  usageHydration,
  subscriptionHydration,
}: MainAppShellProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <SubscriptionUsageProvider initialData={usageHydration ?? undefined}>
        <SubscriptionProvider initialData={subscriptionHydration ?? undefined}>
          <MainLayout>{children}</MainLayout>
        </SubscriptionProvider>
      </SubscriptionUsageProvider>
    </SessionProvider>
  );
}
