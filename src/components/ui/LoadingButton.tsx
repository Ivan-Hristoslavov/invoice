"use client";

import * as React from "react";
import { Spinner } from "@heroui/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadingButtonProps = ButtonProps & {
  loading?: boolean;
  idleText?: React.ReactNode;
  loadingText?: React.ReactNode;
  spinnerPlacement?: "start" | "end";
};

export function LoadingButton({
  loading = false,
  idleText,
  loadingText = "Обработка...",
  spinnerPlacement = "start",
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  const idleContent = idleText ?? children;
  const loadingContent = loadingText ?? idleContent;

  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={cn("inline-flex items-center gap-2", className)}
    >
      {loading ? (
        <>
          {spinnerPlacement === "start" ? (
            <Spinner size="sm" color="current" className="shrink-0" />
          ) : null}
          <span>{loadingContent}</span>
          {spinnerPlacement === "end" ? (
            <Spinner size="sm" color="current" className="shrink-0" />
          ) : null}
        </>
      ) : (
        idleContent
      )}
    </Button>
  );
}
