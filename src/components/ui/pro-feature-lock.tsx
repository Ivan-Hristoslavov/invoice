"use client";

import React from "react";
import { Lock, Crown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";

type PlanType = "PRO" | "BUSINESS";

interface ProFeatureLockProps {
  /** The feature requires this plan or higher */
  requiredPlan?: PlanType;
  /** Current user's plan */
  currentPlan?: string | null;
  /** Feature name to display in messages */
  featureName?: string;
  /** Children to render (will be disabled/overlaid if locked) */
  children?: React.ReactNode;
  /** Show as a banner instead of wrapping children */
  variant?: "button" | "banner" | "overlay" | "inline";
  /** Additional class names */
  className?: string;
  /** Custom message to display */
  message?: string;
  /** Show upgrade link */
  showUpgradeLink?: boolean;
  /** Callback when upgrade is clicked */
  onUpgradeClick?: () => void;
}

/**
 * Checks if a plan has access to features of required plan
 */
function hasAccess(currentPlan: string | null, requiredPlan: PlanType): boolean {
  const planHierarchy: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    BUSINESS: 2,
  };

  const current = planHierarchy[currentPlan || "FREE"] ?? 0;
  const required = planHierarchy[requiredPlan] ?? 1;

  return current >= required;
}

/**
 * Returns the plan badge color
 */
function getPlanBadgeVariant(plan: PlanType): "default" | "secondary" | "outline" {
  switch (plan) {
    case "BUSINESS":
      return "default";
    case "PRO":
    default:
      return "secondary";
  }
}

/**
 * Reusable component for locking features based on subscription plan.
 * Displays locked state with upgrade prompt for users on lower plans.
 */
export function ProFeatureLock({
  requiredPlan = "PRO",
  currentPlan,
  featureName,
  children,
  variant = "button",
  className,
  message,
  showUpgradeLink = true,
  onUpgradeClick,
}: ProFeatureLockProps) {
  const isLocked = !hasAccess(currentPlan, requiredPlan);

  // If not locked, render children as-is
  if (!isLocked) {
    return <>{children}</>;
  }

  const defaultMessage =
    featureName
      ? `${featureName} е налична само в ${requiredPlan}${requiredPlan === "PRO" ? " и BUSINESS" : ""} плана.`
      : `Тази функция е налична само в ${requiredPlan}${requiredPlan === "PRO" ? " и BUSINESS" : ""} плана.`;

  const displayMessage = message || defaultMessage;

  // Banner variant - shows a prominent upgrade banner
  if (variant === "banner") {
    return (
      <div
        className={cn(
          "rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800 p-4",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                {requiredPlan} функция
              </span>
              <Badge variant={getPlanBadgeVariant(requiredPlan)} className="text-xs">
                {requiredPlan}
              </Badge>
            </div>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              {displayMessage}
            </p>
            {showUpgradeLink && (
              <Link href="/settings/subscription">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={onUpgradeClick}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Надградете до {requiredPlan}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        {children && (
          <div className="mt-4 opacity-50 pointer-events-none">{children}</div>
        )}
      </div>
    );
  }

  // Overlay variant - shows content with a lock overlay
  if (variant === "overlay") {
    return (
      <div className={cn("relative", className)}>
        <div className="opacity-50 pointer-events-none blur-[1px]">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3 max-w-xs">
              {displayMessage}
            </p>
            {showUpgradeLink && (
              <Link href="/settings/subscription">
                <Button size="sm" variant="outline" onClick={onUpgradeClick}>
                  <Crown className="h-4 w-4 mr-2 text-amber-500" />
                  Надградете
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Inline variant - shows a small inline indicator
  if (variant === "inline") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-muted-foreground cursor-not-allowed",
                className
              )}
            >
              <Lock className="h-3.5 w-3.5" />
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                {requiredPlan}
              </Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{displayMessage}</p>
            {showUpgradeLink && (
              <Link
                href="/settings/subscription"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                Надградете сега →
              </Link>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Button variant (default) - replaces button with locked version
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            disabled
            className={cn(
              "relative cursor-not-allowed opacity-70",
              className
            )}
          >
            <Lock className="h-4 w-4 mr-2" />
            {children || "Заключено"}
            <Badge
              variant={getPlanBadgeVariant(requiredPlan)}
              className="ml-2 text-xs px-1.5 py-0"
            >
              {requiredPlan}
            </Badge>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm mb-2">{displayMessage}</p>
          {showUpgradeLink && (
            <Link
              href="/settings/subscription"
              className="text-xs text-primary hover:underline"
              onClick={onUpgradeClick}
            >
              Надградете сега →
            </Link>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Usage counter component for limited features
 */
interface UsageCounterProps {
  used: number;
  limit: number;
  label?: string;
  showWarning?: boolean;
  warningThreshold?: number;
  className?: string;
}

export function UsageCounter({
  used,
  limit,
  label = "използвани",
  showWarning = true,
  warningThreshold = 0.8,
  className,
}: UsageCounterProps) {
  const percentage = limit > 0 ? used / limit : 0;
  const isWarning = showWarning && percentage >= warningThreshold;
  const isAtLimit = used >= limit;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "text-sm font-medium",
          isAtLimit
            ? "text-destructive"
            : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground"
        )}
      >
        <span className="font-bold">{used}</span>
        <span className="mx-1">/</span>
        <span>{limit === Infinity ? "∞" : limit}</span>
        {label && <span className="ml-1 text-xs opacity-70">{label}</span>}
      </div>
      {isAtLimit && (
        <Badge variant="destructive" className="text-xs">
          Лимит
        </Badge>
      )}
      {!isAtLimit && isWarning && (
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          Почти
        </Badge>
      )}
    </div>
  );
}

/**
 * Locked button that redirects to upgrade page
 */
interface LockedButtonProps {
  requiredPlan?: PlanType;
  children: React.ReactNode;
  className?: string;
}

export function LockedButton({
  requiredPlan = "PRO",
  children,
  className,
}: LockedButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/settings/subscription">
            <Button
              variant="outline"
              className={cn(
                "relative border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30",
                className
              )}
            >
              <Lock className="h-4 w-4 mr-2 text-amber-500" />
              {children}
              <Badge
                variant="secondary"
                className="ml-2 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              >
                {requiredPlan}
              </Badge>
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Надградете до {requiredPlan} за тази функция</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { hasAccess };
