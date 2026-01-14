"use client";

import * as React from "react";
import { Progress as RadixProgress } from "@radix-ui/themes";

const Progress = React.forwardRef<
  React.ElementRef<typeof RadixProgress>,
  React.ComponentPropsWithoutRef<typeof RadixProgress>
>(({ className, ...props }, ref) => (
  <RadixProgress
    ref={ref}
    className={className}
    {...props}
  />
));

Progress.displayName = "Progress";

export { Progress };
