"use client";

import * as React from "react";
import { Chip } from "@heroui/react";

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

const chipColorMap: Record<string, "default" | "primary" | "secondary" | "danger" | "success" | "warning"> = {
  // Generic UI variants
  default: "default",
  secondary: "secondary",
  destructive: "danger",
  success: "success",
  warning: "warning",
  info: "primary",
  outline: "default",
  "outline-solid": "default",
  // Invoice status variants (uppercase DB values)
  DRAFT: "default",
  SENT: "primary",
  ISSUED: "primary",
  UNPAID: "primary",
  PAID: "success",
  OVERDUE: "danger",
  CANCELLED: "default",
  VOIDED: "warning",
  PARTIAL: "warning",
  // Invoice status variants (lowercase)
  draft: "default",
  sent: "primary",
  issued: "primary",
  unpaid: "primary",
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
      color={chipColorMap[variant] ?? "primary"}
      variant={chipVariantMap[variant] ?? "solid"}
      className={className}
      size="sm"
      {...props}
    >
      {children}
    </Chip>
  );
}

export { Badge };
