import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ResponsiveActionBarProps = {
  children: ReactNode;
  className?: string;
  /** Sticky to bottom of viewport on mobile */
  mobileSticky?: boolean;
};

/**
 * Sticky bottom bar on mobile, inline in flow on `md+`.
 */
export function ResponsiveActionBar({ children, className, mobileSticky = true }: ResponsiveActionBarProps) {
  return (
    <div
      className={cn(
        mobileSticky &&
          "safe-area-pb fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 p-3 backdrop-blur-md sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0",
        "flex flex-col gap-2 sm:flex-row sm:justify-end",
        className
      )}
    >
      {children}
    </div>
  );
}
