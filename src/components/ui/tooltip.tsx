"use client";

import * as React from "react";
import { Tooltip as HeroUITooltip } from "@heroui/react";
import { cn } from "@/lib/utils";

const TooltipProvider = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// Map delayDuration → HeroUI Tooltip delay
const Tooltip = React.forwardRef<
  object,
  React.ComponentProps<typeof HeroUITooltip> & { delayDuration?: number }
>(({ delayDuration, delay, ...props }, _ref) => (
  <HeroUITooltip delay={delayDuration ?? delay} {...props} />
));
Tooltip.displayName = "Tooltip";

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUITooltip.Trigger> & { asChild?: boolean }
>(({ asChild: _asChild, className, children, ...props }, ref) => (
  <HeroUITooltip.Trigger
    ref={ref}
    className={cn("cursor-default", className)}
    {...props}
  >
    {children}
  </HeroUITooltip.Trigger>
));
TooltipTrigger.displayName = "TooltipTrigger";

// Accept side for API compatibility; HeroUI uses placement on the root Tooltip
const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUITooltip.Content> & {
    side?: "top" | "right" | "bottom" | "left";
    sideOffset?: number;
  }
>(({ className, side: _side, sideOffset: _sideOffset, ...props }, ref) => (
  <HeroUITooltip.Content
    ref={ref}
    className={cn(
      "z-50 overflow-hidden rounded-lg bg-foreground px-3 py-1.5 text-xs text-background shadow-md",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
