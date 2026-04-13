"use client";

import * as React from "react";
import { TextArea as HeroTextArea } from "@heroui/react";
import { cn } from "@/lib/utils";

/**
 * Multiline input — HeroUI TextArea (React Aria).
 * @see https://heroui.com/docs/react/components/textarea
 */
export interface TextareaProps
  extends Omit<React.ComponentProps<typeof HeroTextArea>, "onChange"> {
  "aria-invalid"?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, "aria-invalid": ariaInvalid, onChange, ...props }, ref) => (
    <HeroTextArea
      ref={ref}
      fullWidth
      className={cn(
        "min-h-32 rounded-2xl border border-border/80 bg-background text-foreground shadow-sm",
        "text-sm font-medium placeholder:text-muted-foreground placeholder:font-normal",
        "transition-[border-color,box-shadow,background-color] duration-150",
        "data-[hovered=true]:bg-background data-[hovered=true]:border-primary/35",
        "data-[hovered=true]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]",
        "data-[focus-visible=true]:border-primary/50 data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-ring/40",
        ariaInvalid && "data-[invalid=true]:border-destructive data-[invalid=true]:focus-visible:ring-destructive",
        className
      )}
      data-invalid={ariaInvalid ? "true" : undefined}
      aria-invalid={ariaInvalid}
      onChange={onChange}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
