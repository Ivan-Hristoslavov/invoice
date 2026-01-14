"use client";

import * as React from "react";
import { Button as RadixButton } from "@radix-ui/themes";
import type { ButtonProps as RadixButtonProps } from "@radix-ui/themes";

export interface ButtonProps extends Omit<RadixButtonProps, "size"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "soft" | "surface" | "classic";
  size?: "sm" | "default" | "lg" | "icon" | "1" | "2" | "3" | "4";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className, children, ...props }, ref) => {
    // Map shadcn variants to Radix variants
    const radixVariant = 
      variant === "destructive" ? "solid" :
      variant === "outline" ? "outline" :
      variant === "secondary" ? "soft" :
      variant === "ghost" ? "ghost" :
      variant === "link" ? "ghost" :
      variant === "soft" ? "soft" :
      variant === "surface" ? "surface" :
      variant === "classic" ? "classic" :
      "solid";

    // Map shadcn sizes to Radix sizes
    const radixSize = 
      size === "sm" ? "1" :
      size === "default" ? "2" :
      size === "lg" ? "3" :
      size === "icon" ? "2" :
      size || "2";

    const color = variant === "destructive" ? "red" : undefined;

    return (
      <RadixButton
        ref={ref}
        variant={radixVariant}
        size={radixSize as "1" | "2" | "3" | "4"}
        color={color}
        className={className}
        {...props}
      >
        {children}
      </RadixButton>
    );
  }
);
Button.displayName = "Button";

export { Button };
