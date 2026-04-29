import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SectionProps = {
  children: React.ReactNode;
  className?: string;
  density?: "comfortable" | "compact";
};

export function Section({ children, className, density = "comfortable" }: SectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card text-card-foreground shadow-sm",
        density === "compact" ? "p-3 sm:p-4" : "p-4 sm:p-5",
        className
      )}
    >
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  description?: string;
  right?: ReactNode;
  className?: string;
};

export function SectionHeader({ title, description, right, className }: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
