import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HelpCopyKey } from "@/config/help-copy";
import { getHelpText } from "@/config/help-copy";
import type { ReactNode } from "react";

type InfoCalloutProps = {
  /** Or pass help key from help-copy */
  helpKey?: HelpCopyKey;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "muted";
};

export function InfoCallout({ helpKey, children, className, variant = "default" }: InfoCalloutProps) {
  const text = helpKey ? getHelpText(helpKey) : children;
  if (!text) return null;
  return (
    <div
      role="note"
      className={cn(
        "flex gap-2.5 rounded-xl border px-3 py-2.5 text-sm leading-snug",
        variant === "default" && "border-primary/25 bg-primary/5 text-foreground",
        variant === "muted" && "border-border/60 bg-muted/40 text-muted-foreground",
        className
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1">{typeof text === "string" ? <p>{text}</p> : text}</div>
    </div>
  );
}
