"use client";

import * as React from "react";
import { Checkbox as HeroUICheckbox } from "@heroui/react";

const Checkbox = React.forwardRef<
  HTMLLabelElement,
  Omit<React.ComponentProps<typeof HeroUICheckbox>, "children" | "isSelected" | "onSelectionChange"> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <HeroUICheckbox
    ref={ref}
    className={className}
    isSelected={checked}
    onSelectionChange={(isSelected: boolean) => { onCheckedChange?.(isSelected); }}
    {...(props as any)}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
