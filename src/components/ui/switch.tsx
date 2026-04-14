"use client";

import * as React from "react";
import { Switch as HeroUISwitch } from "@heroui/react";

type HeroSwitchProps = React.ComponentProps<typeof HeroUISwitch>;

export type SwitchProps = Omit<
  HeroSwitchProps,
  "children" | "onChange" | "isSelected" | "defaultSelected" | "onSelectionChange"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

/**
 * HeroUI v3 Switch е compound компонент — без `<Control><Thumb /></Control>` няма видима дръжка/писта.
 * React Aria ползва `isSelected` + `onChange`, не `onSelectionChange`.
 */
const Switch = React.forwardRef<HTMLLabelElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <HeroUISwitch
      ref={ref}
      className={className}
      isSelected={checked}
      onChange={onCheckedChange}
      {...props}
    >
      <HeroUISwitch.Control>
        <HeroUISwitch.Thumb />
      </HeroUISwitch.Control>
    </HeroUISwitch>
  )
);
Switch.displayName = "Switch";

export { Switch };
