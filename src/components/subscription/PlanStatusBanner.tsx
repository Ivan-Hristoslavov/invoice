"use client";

import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/subscription-plans";

type SubscriptionLike = {
  plan: string;
  status: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean | null;
} | null;

type PlanStatusBannerProps = {
  subscription: SubscriptionLike;
  getSubscriptionEndsText: () => string;
  onCancelClick: () => void;
  cancelingSubscription: boolean;
};

/**
 * Current plan row with period end and cancel entry (non-FREE only).
 */
export function PlanStatusBanner({
  subscription,
  getSubscriptionEndsText,
  onCancelClick,
  cancelingSubscription,
}: PlanStatusBannerProps) {
  if (!subscription || subscription.plan === "FREE") {
    return null;
  }

  const planKey = subscription.plan as SubscriptionPlanKey;
  const label = planKey in SUBSCRIPTION_PLANS ? SUBSCRIPTION_PLANS[planKey].displayName : subscription.plan;

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/8 to-primary/3 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="truncate text-sm font-medium sm:text-base">{label}</span>
              <Badge
                variant={subscription.cancelAtPeriodEnd ? "outline" : "secondary"}
                className="h-5 text-[10px] sm:text-xs"
              >
                {subscription.cancelAtPeriodEnd ? "Изтича" : "Активен"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground sm:text-sm">{getSubscriptionEndsText()}</p>
          </div>
        </div>
        {subscription.cancelAtPeriodEnd !== true && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            onClick={onCancelClick}
            disabled={cancelingSubscription}
            aria-label="Управление на абонамента: отказ"
          >
            {cancelingSubscription ? "…" : "Управление / отказ"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
