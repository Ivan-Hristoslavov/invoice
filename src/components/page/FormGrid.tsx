import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type FormGridProps = {
  children: React.ReactNode;
  className?: string;
  /** Default: 1 / 2 / 3 columns at breakpoints */
  columns?: "1-2-3" | "1-2" | "1";
};

export function FormGrid({ children, className, columns = "1-2-3" }: FormGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        columns === "1-2-3" && "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        columns === "1-2" && "grid-cols-1 md:grid-cols-2",
        columns === "1" && "grid-cols-1",
        className
      )}
    >
      {children}
    </div>
  );
}
