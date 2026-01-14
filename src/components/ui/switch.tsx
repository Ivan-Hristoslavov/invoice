"use client";

import * as React from "react";
import { Switch as RadixSwitch } from "@radix-ui/themes";

const Switch = React.forwardRef<
  React.ElementRef<typeof RadixSwitch>,
  React.ComponentPropsWithoutRef<typeof RadixSwitch>
>(({ className, ...props }, ref) => (
  <RadixSwitch
    ref={ref}
    className={className}
    {...props}
  />
));
Switch.displayName = "Switch";

export { Switch };
