import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FilterBarProps = {
  /** Search field or left cluster */
  leading?: ReactNode;
  /** Sort, status chips, date range */
  children?: ReactNode;
  className?: string;
};

/**
 * Rounded bar for search + filter controls on list pages.
 */
export function FilterBar({ leading, children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/50 p-3 sm:flex-row sm:items-center sm:gap-3",
        className
      )}
    >
      {leading ? <div className="min-w-0 flex-1">{leading}</div> : null}
      {children ? <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
