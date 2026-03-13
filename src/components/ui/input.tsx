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

// Numeric input: keep native input for now but same visual style as HeroUI
export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  allowDecimal?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, allowDecimal = true, onChange, onKeyDown, value, placeholder, name, onBlur, disabled, "aria-invalid": ariaInvalid, ...rest }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allowedKeys = ["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
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
      const syntheticEvent = { ...e, target: { ...e.target, value: newValue, name: name || e.target.name } } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        aria-invalid={ariaInvalid}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          ariaInvalid && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...rest}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { Input, NumericInput };
