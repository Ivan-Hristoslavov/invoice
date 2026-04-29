import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type ResponsiveDataTableProps = {
  /** Desktop table */
  desktop: ReactNode;
  /** Mobile card list */
  mobile: ReactNode;
  className?: string;
};

/**
 * Switches between scrollable table (md+) and stacked cards (mobile).
 */
export function ResponsiveDataTable({ desktop, mobile, className }: ResponsiveDataTableProps) {
  return (
    <div className={cn("w-full min-w-0", className)}>
      <div className="hidden md:block">{desktop}</div>
      <div className="md:hidden">{mobile}</div>
    </div>
  );
}
