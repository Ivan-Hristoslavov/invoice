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
        "min-h-32 rounded-2xl text-sm font-medium placeholder:font-normal",
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
