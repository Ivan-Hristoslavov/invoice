"use client";

import * as React from "react";
import { Breadcrumbs as HeroBreadcrumbs } from "@heroui/react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
};

export type BreadcrumbsBarProps = {
  items: BreadcrumbItem[];
  className?: string;
  /** Passed to HeroUI root; defaults to chevron. */
  separator?: React.ReactNode;
};

/**
 * HeroUI breadcrumbs with consistent spacing and optional `href` on intermediate items.
 */
export function BreadcrumbsBar({ items, className, separator }: BreadcrumbsBarProps) {
  return (
    <HeroBreadcrumbs
      className={cn(
        "flex flex-wrap items-center gap-1 text-sm text-muted-foreground",
        className
      )}
      separator={separator}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast || !item.href) {
          return (
            <HeroBreadcrumbs.Item key={index} className="text-foreground">
              {item.label}
            </HeroBreadcrumbs.Item>
          );
        }
        return (
          <HeroBreadcrumbs.Item key={index} href={item.href}>
            {item.label}
          </HeroBreadcrumbs.Item>
        );
      })}
    </HeroBreadcrumbs>
  );
}
