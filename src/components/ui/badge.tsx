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
  // Всички стандартни бейджове (default/secondary/info/success/warning/outline)
  // се визуализират в зелено (success). Само destructive остава червен.
  default: "success",
  secondary: "success",
  destructive: "danger",
  success: "success",
  warning: "success",
  info: "success",
  outline: "success",
  "outline-solid": "success",
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
