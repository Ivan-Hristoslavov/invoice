import { loadMainSubscriptionData } from "./load-main-subscription-data";
import { MainAppShell } from "./main-app-shell";

export default async function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydration = await loadMainSubscriptionData();

  return (
    <MainAppShell
      usageHydration={
        hydration
          ? {
              userKey: hydration.userKey,
              usage: hydration.usage,
              plan: hydration.plan,
              fetchedAt: hydration.fetchedAt,
            }
          : null
      }
      subscriptionHydration={
        hydration
          ? {
              userKey: hydration.userKey,
              subscription: hydration.subscription,
              fetchedAt: hydration.fetchedAt,
            }
          : null
      }
    >
      {children}
    </MainAppShell>
  );
}
