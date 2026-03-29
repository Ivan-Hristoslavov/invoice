"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  type?: "error" | "warning" | "info";
  onRetry?: () => void;
  retryText?: string;
  inline?: boolean;
  showIcon?: boolean;
  actions?: React.ReactNode;
}

function typeToVariant(type: ErrorMessageProps["type"]): "destructive" | "warning" | "accent" {
  switch (type) {
    case "warning":
      return "warning";
    case "info":
      return "accent";
    default:
      return "destructive";
  }
}

export function ErrorMessage({
  title,
  message,
  type = "error",
  onRetry,
  retryText = "Опитайте отново",
  inline = false,
  showIcon: _showIcon = true,
  actions,
  className,
  children,
  ...props
}: ErrorMessageProps) {
  if (inline) {
    return (
      <div className={cn("rounded-md text-sm", className)} {...props}>
        {title && <p className={cn("mb-1 font-medium", type === "error" && "text-destructive")}>{title}</p>}
        {message && <div>{message}</div>}
        {children}
        {(onRetry || actions) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} className="inline-flex items-center">
                <RefreshCwIcon className="mr-1 h-3 w-3" />
                {retryText}
              </Button>
            )}
            {actions}
          </div>
        )}
      </div>
    );
  }

  return (
    <Alert variant={typeToVariant(type)} className={cn(className)} {...props}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription className="block">
        <div className="space-y-3">
          {message ? <p>{message}</p> : null}
          {children}
          {(onRetry || actions) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry} className="inline-flex items-center">
                  <RefreshCwIcon className="mr-1 h-3 w-3" />
                  {retryText}
                </Button>
              )}
              {actions}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function ErrorBoundary({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ErrorMessage
        title="Възникна грешка"
        message={`${error.message || "Нещо се обърка при зареждането на тази страница."}`}
        type="error"
        onRetry={resetErrorBoundary}
      />
    </div>
  );
}
