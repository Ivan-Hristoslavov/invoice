import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { SubscriptionHistory } from "@/components/subscription/SubscriptionHistory";

export const metadata: Metadata = {
  title: `Billing & Subscription | ${APP_NAME}`,
  description: "Manage your subscription and billing information",
};

export default async function BillingSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing & Subscription</CardTitle>
          <CardDescription>
            Manage your plan, pricing, and payment history from one place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionPlans />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Your recent subscription invoices and status changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionHistory />
        </CardContent>
      </Card>
    </div>
  );
} 