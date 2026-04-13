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

const sessionProviderProps = {
  refetchOnWindowFocus: false as const,
  refetchWhenOffline: false as const,
};

/**
 * `SubscriptionUsageProvider` calls `useSession()` and must sit under `SessionProvider`.
 * Root `AuthProvider` also provides a provider, but the `(main)` client tree still needs
 * an explicit provider here so Next.js does not evaluate `useSession` outside that context.
 */
export function MainAppShell({
  children,
  usageHydration,
  subscriptionHydration,
}: MainAppShellProps) {
  return (
    <SessionProvider {...sessionProviderProps}>
      <SubscriptionUsageProvider initialData={usageHydration ?? undefined}>
        <SubscriptionProvider initialData={subscriptionHydration ?? undefined}>
          <MainLayout>{children}</MainLayout>
        </SubscriptionProvider>
      </SubscriptionUsageProvider>
    </SessionProvider>
  );
}
