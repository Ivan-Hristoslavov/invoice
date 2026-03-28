"use client";

import * as React from "react";
import { ProgressBar } from "@heroui/react";
import { cn } from "@/lib/utils";

/**
 * @see https://heroui.com/docs/react/components/progress-bar
 */
export interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100 }, ref) => (
    <ProgressBar
      ref={ref}
      value={Number(value)}
      minValue={0}
      maxValue={Number(max)}
      className={cn("w-full", className)}
    >
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  )
);
Progress.displayName = "Progress";

export { Progress };
