"use client";

import * as React from "react";
import { Chip } from "@heroui/react";

export interface BadgeProps extends React.ComponentProps<typeof Chip> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline-solid"
    | "outline"
    | "success"
    | "warning"
    | "info";
}

const chipColorMap: Record<string, "primary" | "secondary" | "danger" | "success" | "warning"> = {
  default: "primary",
  secondary: "secondary",
  destructive: "danger",
  success: "success",
  warning: "warning",
  info: "secondary",
  outline: "secondary",
  "outline-solid": "secondary",
};

const chipVariantMap: Record<string, "solid" | "soft" | "outline"> = {
  default: "solid",
  secondary: "soft",
  destructive: "soft",
  success: "soft",
  warning: "soft",
  info: "soft",
  outline: "outline",
  "outline-solid": "outline",
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
