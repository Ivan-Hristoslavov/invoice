import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page";

type ListPageShellProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  stats?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Standard list page: header, optional stats row, filter bar, then main content (table/cards).
 */
export function ListPageShell({
  title,
  description,
  actions,
  stats,
  filters,
  children,
  className,
}: ListPageShellProps) {
  return (
    <div className={cn("app-page-shell", className)}>
      <PageHeader title={title} description={description} actions={actions} />
      {stats ? <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats}</div> : null}
      {filters ? <div className="mb-4">{filters}</div> : null}
      {children}
    </div>
  );
}
