"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="bg">
      <body className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="max-w-md text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight">Нещо се обърка</h1>
            <p className="mb-8 text-muted-foreground">
              Възникна неочаквана грешка. Моля, опитайте отново или се върнете към началото.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
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
          <p className="mt-12 text-sm text-muted-foreground">{APP_NAME}</p>
        </div>
      </body>
    </html>
  );
}
