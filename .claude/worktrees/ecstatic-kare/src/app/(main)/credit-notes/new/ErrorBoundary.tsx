"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Грешка</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || "Възникна неочаквана грешка"}
            </p>
            <Button onClick={() => window.location.reload()}>Опитай отново</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
