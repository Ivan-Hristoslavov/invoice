"use client";

import * as React from "react";
import { RadioGroup as HeroUIRadioGroup, Radio } from "@heroui/react";
import { cn } from "@/lib/utils";

// Wrapper: controlled value + onValueChange mapped to HeroUI RadioGroup
const RadioGroup = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof HeroUIRadioGroup>, "onChange"> & {
    value?: string;
    onValueChange?: (value: string) => void;
  }
>(({ value, onValueChange, className, children, ...props }, ref) => (
  <HeroUIRadioGroup
    ref={ref}
    value={value}
    onChange={onValueChange}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  >
    {children}
  </HeroUIRadioGroup>
));
RadioGroup.displayName = "RadioGroup";

// RadioGroupItem: renders a Radio with visible indicator
const RadioGroupItem = React.forwardRef<
  HTMLLabelElement,
  Omit<React.ComponentProps<typeof Radio>, "isDisabled" | "children"> & {
    value: string;
    id?: string;
    disabled?: boolean;
    children?: React.ReactNode;
  }
>(({ className, value, children, disabled, id, ...props }, ref) => (
  <Radio
    ref={ref}
    id={id}
    value={value}
    isDisabled={disabled}
    className={cn("flex items-center gap-2 cursor-pointer", className)}
    {...props}
  >
    <Radio.Control>
      <Radio.Indicator />
    </Radio.Control>
    {children ? <Radio.Content>{children}</Radio.Content> : null}
  </Radio>
));
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
