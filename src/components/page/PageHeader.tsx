import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

/**
 * Page title, optional lead, and actions. Actions wrap on small screens.
 */
export function PageHeader({ title, description, leading, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-4 sm:mb-5", className)}>
      {leading ? <div className="mb-2">{leading}</div> : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground leading-snug sm:mt-1">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex w-full flex-shrink-0 flex-wrap items-stretch gap-2 md:w-auto md:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
