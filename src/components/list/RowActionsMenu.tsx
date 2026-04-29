"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

type RowAction = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
};

type RowActionsMenuProps = {
  actions: RowAction[];
  "aria-label"?: string;
};

export function RowActionsMenu({
  actions,
  "aria-label": ariaLabel = "Действия",
}: RowActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label={ariaLabel}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {actions.map((a) => (
          <DropdownMenuItem
            key={a.id}
            isDisabled={a.disabled}
            className={
              a.variant === "destructive"
                ? "text-destructive focus:text-destructive"
                : undefined
            }
            onClick={() => {
              if (!a.disabled) {
                a.onSelect();
              }
            }}
          >
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { RowAction };