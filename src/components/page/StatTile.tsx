import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  /** Optional small icon in corner */
  icon?: ReactNode;
};

export function StatTile({ label, value, hint, className, icon }: StatTileProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm sm:p-4",
        className
      )}
    >
      {icon ? (
        <div className="absolute right-2 top-2 text-muted-foreground/40 sm:right-3 sm:top-3">{icon}</div>
      ) : null}
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tracking-tight sm:text-xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
