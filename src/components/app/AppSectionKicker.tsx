import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const kickerClass =
  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-2.5 py-1 text-[11px] font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-500/10 dark:border-emerald-500/35 dark:bg-emerald-500/15 dark:text-emerald-100 dark:ring-emerald-400/15 sm:gap-2 sm:px-3 sm:py-1 sm:text-xs";

/**
 * Малък зелен етикет с икона — визуално съгласуван с marketing chip-овете,
 * за потребителското приложение (табло, списъци, карти).
 */
export function AppSectionKicker({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(kickerClass, className)}>
      <Icon
        className="h-3.5 w-3.5 shrink-0 text-emerald-700 opacity-90 dark:text-emerald-300 sm:h-4 sm:w-4"
        aria-hidden
      />
      {children}
    </span>
  );
}
