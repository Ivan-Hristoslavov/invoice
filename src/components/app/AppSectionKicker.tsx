import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const kickerClass =
  "inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-100 sm:text-[11px]";

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
      <Icon className="h-3 w-3 shrink-0 text-emerald-700 dark:text-emerald-300 sm:h-3.5 sm:w-3.5" aria-hidden />
      {children}
    </span>
  );
}
