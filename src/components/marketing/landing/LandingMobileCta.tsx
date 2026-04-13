"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingMobileCta() {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
      <div className="rounded-3xl border border-border/70 bg-background/95 p-2.5 shadow-lg backdrop-blur">
        <Button
          asChild
          className="h-12 w-full border-2 border-white/20 font-semibold text-white shadow-md gradient-primary hover:border-white/45 hover:shadow-md hover:shadow-emerald-500/20"
        >
          <Link href="/signup" className="flex items-center justify-center">
            Започнете безплатно
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
