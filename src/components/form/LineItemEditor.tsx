"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";

type LineItemEditorProps = {
  description: string;
  quantity: string;
  unitPrice: string;
  onDescriptionChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onUnitPriceChange: (v: string) => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Single line row for manual invoice/note line items (shared layout).
 */
export function LineItemEditor({
  description,
  quantity,
  unitPrice,
  onDescriptionChange,
  onQuantityChange,
  onUnitPriceChange,
  onRemove,
  className,
  disabled,
}: LineItemEditorProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-2 rounded-xl border border-border/60 bg-card/50 p-3 sm:grid-cols-[1fr_5rem_6rem_auto] sm:items-end",
        className
      )}
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Описание</label>
        <Input
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
          placeholder="Артикул / услуга"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">К-во</label>
        <Input
          inputMode="decimal"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Цена</label>
        <Input
          inputMode="decimal"
          value={unitPrice}
          onChange={(e) => onUnitPriceChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      {onRemove ? (
        <div className="flex justify-end sm:pb-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={onRemove}
            disabled={disabled}
            aria-label="Премахни ред"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
