"use client";

import { Loader2 } from "lucide-react";

export function LoadingSpinner({ className, size = "medium" }: { className?: string, size?: "small" | "medium" | "large" }) {
  const sizeMap = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  return (
    <div className={`flex justify-center items-center ${className || ""}`}>
      <Loader2 className={`animate-spin ${sizeMap[size]}`} />
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div className="text-center">
        <LoadingSpinner size="large" className="mb-4" />
        <p className="text-muted-foreground">Зареждане...</p>
      </div>
    </div>
  );
} 