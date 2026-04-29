"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ResponsiveActionBar } from "@/components/page/ResponsiveActionBar";

type WizardLayoutProps = {
  /** Sticky step indicator / title row */
  header: ReactNode;
  children: ReactNode;
  /** Sticky footer actions (uses ResponsiveActionBar) */
  footer: ReactNode;
  className?: string;
};

export function WizardLayout({ header, children, footer, className }: WizardLayoutProps) {
  return (
    <div className={cn("relative flex min-h-[50vh] flex-col gap-4 pb-24 sm:pb-6", className)}>
      <div className="sticky top-0 z-10 -mx-1 border-b border-border/50 bg-background/90 px-1 py-2 backdrop-blur sm:static sm:z-0 sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        {header}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <ResponsiveActionBar className="sm:static sm:mt-4 sm:border-0 sm:p-0">
        {footer}
      </ResponsiveActionBar>
    </div>
  );
}
