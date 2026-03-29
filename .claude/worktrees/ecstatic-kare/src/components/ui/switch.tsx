"use client";

import * as React from "react";
import { Switch as HeroUISwitch } from "@heroui/react";

const Switch = React.forwardRef<
  HTMLLabelElement,
  Omit<React.ComponentProps<typeof HeroUISwitch>, "children" | "isSelected" | "onSelectionChange"> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
  }
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <HeroUISwitch
    ref={ref}
    className={className}
    isSelected={checked}
    onSelectionChange={(isSelected: boolean) => { onCheckedChange?.(isSelected); }}
    {...(props as any)}
  />
));
Switch.displayName = "Switch";

export { Switch };
