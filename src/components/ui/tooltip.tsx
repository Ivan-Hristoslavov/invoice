"use client";

import * as React from "react";
import { Tooltip as RadixTooltip } from "@radix-ui/themes";

const TooltipProvider = RadixTooltip.Provider;
const Tooltip = RadixTooltip.Root;
const TooltipTrigger = RadixTooltip.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, ...props }, ref) => (
  <RadixTooltip.Content
    ref={ref}
    className={className}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
