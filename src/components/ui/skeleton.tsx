"use client";

import * as React from "react";
import { Skeleton as RadixSkeleton } from "@radix-ui/themes";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <RadixSkeleton
      className={className}
      {...props}
    />
  );
}
