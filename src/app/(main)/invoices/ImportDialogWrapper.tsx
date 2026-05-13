"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import ImportDialog from "./ImportDialog";
import type { ComponentProps } from "react";

interface Company {
  id: string;
  name: string;
}

const LABEL_FULL = "Импорт на статуси";
const LABEL_SHORT = "Статуси";

interface ImportDialogWrapperProps {
  companies: Company[];
  onApplied?: () => void;
  /** Shorter trigger label for narrow layouts (e.g. mobile filter row). Full phrase in `title`. */
  compactLabel?: boolean;
  /** When false, trigger does not stretch to full width (e.g. desktop toolbar). */
  fullWidth?: boolean;
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerClassName?: string;
}

export default function ImportDialogWrapper({
  companies,
  onApplied,
  compactLabel = false,
  fullWidth = true,
  triggerSize = "sm",
  triggerClassName,
}: ImportDialogWrapperProps) {
  const triggerLabel = compactLabel ? LABEL_SHORT : LABEL_FULL;

  return (
    <ImportDialog companies={companies} onApplied={onApplied}>
      <Button
        type="button"
        size={triggerSize}
        className={cn(
          "min-h-0! justify-center rounded-2xl text-sm",
          fullWidth ? "h-11 w-full min-w-0" : "h-12 min-w-0 shrink-0 px-4 sm:px-5",
          triggerClassName
        )}
        variant="outline"
        title={compactLabel ? LABEL_FULL : undefined}
      >
        <Upload className="mr-2 h-4 w-4 shrink-0" aria-hidden />
        <span className={cn("truncate", compactLabel && "max-[360px]:text-xs")}>{triggerLabel}</span>
      </Button>
    </ImportDialog>
  );
}
