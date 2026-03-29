"use client";

import { EmptyState as HeroEmptyState } from "@heroui/react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @see https://heroui.com/docs/react/components/empty-state
 */
interface EmptyStateProps {
  icon: LucideIcon;
  heading: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, heading, description, action, className }: EmptyStateProps) {
  return (
    <HeroEmptyState
      className={cn(
        "flex flex-col items-center justify-center py-14 px-4 text-center sm:py-16",
        className
      )}
      role="status"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/60 shadow-inner">
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1.5 text-lg font-semibold tracking-tight">{heading}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action}
    </HeroEmptyState>
  );
}
