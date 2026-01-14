"use client";

import * as React from "react";
import { Separator as RadixSeparator } from "@radix-ui/themes";

const Separator = React.forwardRef<
  React.ElementRef<typeof RadixSeparator>,
  React.ComponentPropsWithoutRef<typeof RadixSeparator>
>(({ className, ...props }, ref) => (
  <RadixSeparator
    ref={ref}
    className={className}
    {...props}
  />
));
Separator.displayName = "Separator";

export { Separator };
