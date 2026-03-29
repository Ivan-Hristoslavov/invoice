"use client";

import * as React from "react";
import { Label as HeroUILabel } from "@heroui/react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<typeof HeroUILabel>
>(({ className, ...props }, ref) => (
  <HeroUILabel
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
