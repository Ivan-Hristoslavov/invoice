"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="text-center max-w-md">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 mb-6">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Нещо се обърка</h1>
        <p className="text-muted-foreground mb-8">
          Възникна неочаквана грешка. Моля, опитайте отново или се върнете към началото.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="gap-2" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Опитай отново
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Начало
            </Link>
          </Button>
        </div>
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        {APP_NAME}
      </p>
    </div>
  );
}
