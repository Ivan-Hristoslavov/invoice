"use client";

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
 * Session context comes from root `AuthProvider` with a server-hydrated `session` prop.
 * Do not nest another `SessionProvider` here — it can desync from the server session and hide the shell.
 */
export function MainAppShell({
  children,
  usageHydration,
  subscriptionHydration,
}: MainAppShellProps) {
  return (
    <SubscriptionUsageProvider initialData={usageHydration ?? undefined}>
      <SubscriptionProvider initialData={subscriptionHydration ?? undefined}>
        <MainLayout>{children}</MainLayout>
      </SubscriptionProvider>
    </SubscriptionUsageProvider>
  );
}
