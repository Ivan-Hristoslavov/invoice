"use client";

import * as React from "react";
import { NumberField as HeroNumberField } from "@heroui/react";
import { cn } from "@/lib/utils";

export type NumberFieldProps = React.ComponentProps<typeof HeroNumberField>;

function NumberFieldRoot({ className, fullWidth = true, ...props }: NumberFieldProps) {
  return (
    <HeroNumberField
      fullWidth={fullWidth}
      className={cn("min-w-0", className)}
      {...props}
    />
  );
}

export const NumberField = Object.assign(NumberFieldRoot, {
  Group: HeroNumberField.Group,
  Input: HeroNumberField.Input,
  IncrementButton: HeroNumberField.IncrementButton,
  DecrementButton: HeroNumberField.DecrementButton,
});
