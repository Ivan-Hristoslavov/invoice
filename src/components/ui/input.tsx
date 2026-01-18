import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// Numeric input that only allows numbers and decimal point
export interface NumericInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  allowDecimal?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, allowDecimal = true, onChange, onKeyDown, value, placeholder, name, onBlur, disabled, ...rest }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      
      // Allow decimal point if enabled
      if (allowDecimal && (e.key === '.' || e.key === ',')) {
        // Only allow one decimal point
        const currentValue = (e.target as HTMLInputElement).value;
        if (currentValue.includes('.') || currentValue.includes(',')) {
          e.preventDefault();
          return;
        }
        return;
      }
      
      // Allow Ctrl/Cmd + A, C, V, X
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) {
        return;
      }
      
      // Allow numbers
      if (/^[0-9]$/.test(e.key)) {
        return;
      }
      
      // Allow special keys
      if (allowedKeys.includes(e.key)) {
        return;
      }
      
      // Prevent all other keys
      e.preventDefault();
      
      // Call original onKeyDown if provided
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Filter out non-numeric characters (except decimal point if allowed)
      let newValue = e.target.value;
      if (allowDecimal) {
        // Replace comma with dot, then remove any non-numeric/non-dot characters
        newValue = newValue.replace(',', '.').replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const parts = newValue.split('.');
        if (parts.length > 2) {
          newValue = parts[0] + '.' + parts.slice(1).join('');
        }
      } else {
        // Remove all non-numeric characters
        newValue = newValue.replace(/[^0-9]/g, '');
      }
      
      // Create a new event-like object with the filtered value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue,
          name: name || e.target.name,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
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
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...rest}
      />
    );
  }
);
NumericInput.displayName = "NumericInput";

export { Input, NumericInput };
