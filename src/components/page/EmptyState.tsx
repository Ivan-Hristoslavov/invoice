import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "empty-state flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center sm:p-10",
        className
      )}
    >
      {icon ? <div className="empty-state-icon text-muted-foreground mb-2 [&>svg]:h-10 [&>svg]:w-10">{icon}</div> : null}
      <p className="text-base font-semibold">{title}</p>
      {description ? <p className="empty-state-text mt-1 max-w-md text-sm">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
