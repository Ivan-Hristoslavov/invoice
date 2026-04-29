"use client";

import { cn } from "@/lib/utils";

type BillingIntervalToggleProps = {
  isYearly: boolean;
  onChange: (isYearly: boolean) => void;
  className?: string;
};

export function BillingIntervalToggle({ isYearly, onChange, className }: BillingIntervalToggleProps) {
  return (
    <div
      className={cn(
        "grid w-full max-w-xs grid-cols-2 gap-0.5 self-center rounded-full border bg-muted/50 p-0.5 sm:max-w-[220px] sm:self-auto",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex min-w-0 items-center justify-center rounded-full px-2 py-1.5 text-xs font-medium transition-all",
          !isYearly
            ? "bg-background text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Месечно
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex min-w-0 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition-all",
          isYearly
            ? "bg-emerald-500 text-white shadow-xs"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Годишно
        <span
          className={cn(
            "rounded-full px-1 py-0.5 text-[8px] font-bold leading-tight",
            isYearly ? "bg-white/20" : "bg-emerald-500/20 text-emerald-600"
          )}
        >
          2 мес. безпл.
        </span>
      </button>
    </div>
  );
}
