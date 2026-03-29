import { MainLayout } from "@/components/layout/MainLayout";
import { SubscriptionUsageProvider } from "@/hooks/subscription-usage-context";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SubscriptionUsageProvider>
      <MainLayout>{children}</MainLayout>
    </SubscriptionUsageProvider>
  );
} 