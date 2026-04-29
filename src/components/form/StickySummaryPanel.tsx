import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

type StickySummaryPanelProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Right column summary for invoice / note totals on wide screens.
 */
export function StickySummaryPanel({ title = "Обобщение", children, className }: StickySummaryPanelProps) {
  return (
    <Card
      className={cn(
        "xl:sticky xl:top-24 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto",
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">{children}</CardContent>
    </Card>
  );
}
