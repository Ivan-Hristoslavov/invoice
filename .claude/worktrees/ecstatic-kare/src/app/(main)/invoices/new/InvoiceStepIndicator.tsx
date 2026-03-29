"use client";

import { Check } from "lucide-react";

export function InvoiceStepIndicator({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: { title: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="overflow-x-auto py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-1">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`
              relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10
              ${
                index < currentStep
                  ? "bg-success border-success text-success-foreground"
                  : index === currentStep
                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted border-muted-foreground/20 text-muted-foreground"
              }
            `}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {index < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <div className="flex h-4 w-4 items-center justify-center">{step.icon}</div>
                  )}
                </div>
              </div>
              <p
                className={`hidden whitespace-nowrap text-center text-[11px] font-semibold sm:block ${index === currentStep ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 w-6 transition-all duration-300 sm:w-12 md:w-16 ${index < currentStep ? "bg-success" : "bg-muted-foreground/20"}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
