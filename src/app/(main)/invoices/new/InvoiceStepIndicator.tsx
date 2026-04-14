"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function InvoiceStepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: { title: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <div
              key={index}
              className={cn(
                "flex min-h-17 flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-center transition-all duration-200 sm:min-h-0 sm:py-3",
                active &&
                  "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10 ring-1 ring-primary/15",
                done && !active && "border-emerald-500/35 bg-emerald-500/[0.07]",
                !active && !done && "border-border/60 bg-muted/25"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm",
                  done && "bg-emerald-600 text-white dark:bg-emerald-600",
                  active && !done && "bg-primary text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2.5} /> : index + 1}
              </div>
              <p
                className={cn(
                  "line-clamp-2 text-[10px] font-semibold leading-tight sm:text-xs",
                  active && "text-foreground",
                  done && !active && "text-emerald-800 dark:text-emerald-300",
                  !active && !done && "text-muted-foreground"
                )}
              >
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
