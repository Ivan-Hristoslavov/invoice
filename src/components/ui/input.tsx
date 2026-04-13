"use client";

import * as React from "react";
import { Input as HeroUIInput } from "@heroui/react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends Omit<React.ComponentProps<typeof HeroUIInput>, "onChange" | "onChangeCapture"> {
  /** When true, shows error state (red border). Passed automatically by FormControl via aria-invalid. */
  "aria-invalid"?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, "aria-invalid": ariaInvalid, onChange, ...props }, ref) => {
    return (
      <HeroUIInput
        ref={ref}
        fullWidth
        className={cn(
          "min-h-11 rounded-2xl border border-border/80 bg-background text-foreground shadow-sm",
          "text-sm font-medium opacity-100 placeholder:text-muted-foreground placeholder:font-normal",
          "transition-[border-color,box-shadow,background-color] duration-150 sm:min-h-12 md:text-sm",
          "data-[hovered=true]:opacity-100 data-[hovered=true]:bg-background data-[hovered=true]:border-primary/35",
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
    );
  }
);
Input.displayName = "Input";

// Numeric input: HeroUI Input shell + decimal/integer filtering (BG comma/dot)
export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  allowDecimal?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      allowDecimal = true,
      onChange,
      onKeyDown,
      value,
      placeholder,
      name,
      onBlur,
      disabled,
      "aria-invalid": ariaInvalid,
      ...rest
    },
    ref
  ) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];
      if (allowDecimal && (e.key === "." || e.key === ",")) {
        const currentValue = (e.target as HTMLInputElement).value;
        if (currentValue.includes(".") || currentValue.includes(",")) e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
      if (/^[0-9]$/.test(e.key)) return;
      if (allowedKeys.includes(e.key)) return;
      e.preventDefault();
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      if (allowDecimal) {
        newValue = newValue.replace(",", ".").replace(/[^0-9.]/g, "");
        const parts = newValue.split(".");
        if (parts.length > 2) newValue = parts[0] + "." + parts.slice(1).join("");
      } else {
        newValue = newValue.replace(/[^0-9]/g, "");
      }
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: newValue, name: name || e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    return (
      <HeroUIInput
        ref={ref}
        type="text"
        inputMode="decimal"
        name={name}
        value={value as string | undefined}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        aria-invalid={ariaInvalid}
        fullWidth
        className={cn(
          "min-h-11 rounded-2xl border border-border/80 bg-background text-foreground shadow-sm",
          "text-sm font-medium opacity-100 placeholder:text-muted-foreground placeholder:font-normal",
          "transition-[border-color,box-shadow,background-color] duration-150 sm:min-h-12 md:text-sm",
          "data-[hovered=true]:opacity-100 data-[hovered=true]:bg-background data-[hovered=true]:border-primary/35",
          "data-[hovered=true]:shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]",
          "data-[focus-visible=true]:border-primary/50 data-[focus-visible=true]:ring-2 data-[focus-visible=true]:ring-ring/40",
          ariaInvalid && "data-[invalid=true]:border-destructive data-[invalid=true]:focus-visible:ring-destructive",
          className
        )}
        data-invalid={ariaInvalid ? "true" : undefined}
        {...rest}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { Input, NumericInput };
