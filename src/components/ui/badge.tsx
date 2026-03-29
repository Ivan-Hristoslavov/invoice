"use client";

import * as React from "react";
import { Chip } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends Omit<React.ComponentProps<typeof Chip>, "variant"> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline-solid"
    | "outline"
    | "success"
    | "warning"
    | "info"
    // Invoice statuses
    | "DRAFT" | "draft"
    | "SENT" | "sent"
    | "ISSUED" | "issued"
    | "UNPAID" | "unpaid"
    | "PAID" | "paid"
    | "OVERDUE" | "overdue"
    | "CANCELLED" | "cancelled"
    | "VOIDED" | "voided"
    | "PARTIAL" | "partial";
}

/** HeroUI Chip `color` — само accent | danger | default | success | warning */
const chipColorMap: Record<string, "accent" | "danger" | "default" | "success" | "warning"> = {
  default: "default",
  secondary: "default",
  destructive: "danger",
  success: "success",
  warning: "warning",
  info: "success",
  outline: "default",
  "outline-solid": "default",
  DRAFT: "default",
  SENT: "accent",
  ISSUED: "accent",
  UNPAID: "accent",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "default",
  VOIDED: "warning",
  PARTIAL: "warning",
  draft: "default",
  sent: "accent",
  issued: "accent",
  unpaid: "accent",
  paid: "success",
  overdue: "danger",
  cancelled: "default",
  voided: "warning",
  partial: "warning",
};

const chipVariantMap: Record<string, "primary" | "secondary" | "soft" | "tertiary"> = {
  default: "soft",
  secondary: "soft",
  destructive: "soft",
  success: "soft",
  warning: "soft",
  info: "soft",
  outline: "secondary",
  "outline-solid": "secondary",
  // Invoice statuses all use soft style
  DRAFT: "soft", draft: "soft",
  SENT: "soft", sent: "soft",
  ISSUED: "soft", issued: "soft",
  UNPAID: "soft", unpaid: "soft",
  PAID: "soft", paid: "soft",
  OVERDUE: "soft", overdue: "soft",
  CANCELLED: "soft", cancelled: "soft",
  VOIDED: "soft", voided: "soft",
  PARTIAL: "soft", partial: "soft",
};

function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <Chip
      color={chipColorMap[variant] ?? "accent"}
      variant={chipVariantMap[variant] ?? "soft"}
      className={cn(
        "inline-flex w-fit max-w-full shrink-0 self-start",
        className
      )}
      size="sm"
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge };
