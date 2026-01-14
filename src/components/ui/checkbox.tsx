"use client";

import * as React from "react";
import { Checkbox as RadixCheckbox } from "@radix-ui/themes";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof RadixCheckbox>,
  React.ComponentPropsWithoutRef<typeof RadixCheckbox>
>(({ className, ...props }, ref) => (
  <RadixCheckbox
    ref={ref}
    className={className}
    {...props}
  />
));
Checkbox.displayName = "Checkbox";

export { Checkbox };
