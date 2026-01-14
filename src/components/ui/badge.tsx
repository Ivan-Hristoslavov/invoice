"use client";

import * as React from "react";
import { Badge as RadixBadge } from "@radix-ui/themes";
import type { BadgeProps as RadixBadgeProps } from "@radix-ui/themes";

export interface BadgeProps extends Omit<RadixBadgeProps, "variant"> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";
}

function Badge({ variant = "default", className, ...props }: BadgeProps) {
  // Map shadcn variants to Radix variants
  const radixVariant = 
    variant === "secondary" ? "soft" :
    variant === "destructive" ? "solid" :
    variant === "outline" ? "outline" :
    variant === "success" ? "solid" :
    variant === "warning" ? "solid" :
    variant === "info" ? "solid" :
    "solid";

  const color = 
    variant === "destructive" ? "red" :
    variant === "success" ? "green" :
    variant === "warning" ? "amber" :
    variant === "info" ? "blue" :
    undefined;

  return (
    <RadixBadge
      variant={radixVariant}
      color={color}
      className={className}
      {...props}
    />
  );
}

export { Badge };
