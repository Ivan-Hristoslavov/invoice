import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type WizardStepProps = {
  children: ReactNode;
  className?: string;
  hidden?: boolean;
};

export function WizardStep({ children, className, hidden }: WizardStepProps) {
  if (hidden) return null;
  return <div className={cn("min-w-0", className)}>{children}</div>;
}
