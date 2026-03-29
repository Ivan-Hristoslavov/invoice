"use client";

import * as React from "react";
import { Alert as HeroAlert } from "@heroui/react";
import { cn } from "@/lib/utils";

/**
 * Inline alerts — HeroUI Alert compound under the hood.
 * @see https://heroui.com/docs/react/components/alert
 */
export type AlertVariant = "default" | "destructive" | "warning" | "success" | "accent";

function variantToStatus(
  variant: AlertVariant
): "default" | "danger" | "warning" | "success" | "accent" {
  switch (variant) {
    case "destructive":
      return "danger";
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "accent":
      return "accent";
    default:
      return "default";
  }
}

function partitionAlertChildren(children: React.ReactNode) {
  const nodes = React.Children.toArray(children).filter(Boolean);
  const contentStart = nodes.findIndex((child) => {
    if (!React.isValidElement(child)) return false;
    const dn = (child.type as { displayName?: string }).displayName;
    return dn === "AlertTitle" || dn === "AlertDescription";
  });

  if (contentStart <= 0) {
    return { indicator: null as React.ReactNode, body: nodes };
  }

  const indicatorNodes = nodes.slice(0, contentStart);
  const body = nodes.slice(contentStart);
  const indicator =
    indicatorNodes.length === 0
      ? null
      : indicatorNodes.length === 1
        ? indicatorNodes[0]
        : React.createElement("span", { className: "flex items-center gap-1" }, indicatorNodes);

  return { indicator, body };
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }
>(({ className, variant = "default", children, ...props }, ref) => {
  const status = variantToStatus(variant);
  const { indicator, body } = partitionAlertChildren(children);

  return (
    <HeroAlert
      ref={ref}
      status={status}
      className={cn("w-full", className)}
      {...props}
    >
      {indicator ? (
        <HeroAlert.Indicator className="shrink-0">{indicator}</HeroAlert.Indicator>
      ) : (
        <HeroAlert.Indicator />
      )}
      <HeroAlert.Content className="min-w-0">{body}</HeroAlert.Content>
    </HeroAlert>
  );
});
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <HeroAlert.Title ref={ref} className={cn(className)} {...props} />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <HeroAlert.Description ref={ref} className={cn(className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
