"use client";

import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";

/**
 * Етикет над секция — HeroUI Chip: success + tertiary (прозрачен фон) + изрична рамка.
 */
export function LandingSectionLabel({ children }: { children: ReactNode }) {
  return (
    <Chip
      color="success"
      variant="tertiary"
      size="sm"
      className="border border-emerald-500/45 bg-emerald-500/[0.07] shadow-sm backdrop-blur-[2px] dark:border-emerald-400/45 dark:bg-emerald-500/12"
    >
      <Chip.Label className="text-[10px] font-semibold uppercase tracking-[0.2em] sm:text-[11px]">
        {children}
      </Chip.Label>
    </Chip>
  );
}
