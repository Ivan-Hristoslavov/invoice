"use client";

import * as React from "react";
import {
  Select as HeroUISelect,
  ListBox,
  Separator,
} from "@heroui/react";
import { cn } from "@/lib/utils";

// ---------- Root ----------
interface SelectProps
  extends Omit<
    React.ComponentProps<typeof HeroUISelect>,
    | "selectedKey"
    | "defaultSelectedKey"
    | "onSelectionChange"
    | "children"
    | "variant"
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    { value, defaultValue, onValueChange, disabled, children, ...props },
    ref
  ) => (
    <HeroUISelect
      ref={ref}
      selectedKey={value || null}
      defaultSelectedKey={defaultValue}
      onSelectionChange={(key) => {
        onValueChange?.(key === null ? "" : String(key));
      }}
      isDisabled={disabled}
      fullWidth
      {...props}
    >
      {children}
    </HeroUISelect>
  )
);
Select.displayName = "Select";

// ---------- Group ----------
const SelectGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// ---------- Value ----------
interface SelectValueProps
  extends Omit<React.ComponentProps<typeof HeroUISelect.Value>, "children"> {
  placeholder?: string;
  children?: React.ReactNode;
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, children, ...props }, ref) => (
    <HeroUISelect.Value ref={ref} {...props}>
      {placeholder
        ? (renderProps: { isPlaceholder?: boolean; selectedText?: string }) =>
            renderProps.isPlaceholder
              ? placeholder
              : (renderProps.selectedText ?? children)
        : children}
    </HeroUISelect.Value>
  )
);
SelectValue.displayName = "SelectValue";

// ---------- Trigger ----------
const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentProps<typeof HeroUISelect.Trigger>, "children"> & {
    className?: string;
    children?: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => (
  <HeroUISelect.Trigger
    ref={ref}
    className={cn("w-full justify-between", className)}
    {...props}
  >
    {children as any}
    <HeroUISelect.Indicator />
  </HeroUISelect.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

// ---------- Scroll buttons (no-op for compat) ----------
const SelectScrollUpButton = () => null;
const SelectScrollDownButton = () => null;

// ---------- Content ----------
const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { position?: string }
>(({ className, children }, ref) => (
  <HeroUISelect.Popover className={cn("z-[100]", className)}>
    <ListBox ref={ref} className="p-1 max-h-[300px] overflow-y-auto">
      {children}
    </ListBox>
  </HeroUISelect.Popover>
));
SelectContent.displayName = "SelectContent";

// ---------- Label ----------
const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-1.5 pl-2 pr-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider", className)}
    {...props}
  />
));
SelectLabel.displayName = "SelectLabel";

// ---------- Item ----------
interface SelectItemProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  textValue?: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, disabled, children, className, ...props }, ref) => (
    <ListBox.Item
      ref={ref}
      id={value}
      textValue={typeof children === "string" ? children : value}
      isDisabled={disabled}
      className={cn("cursor-default rounded-lg", className)}
      {...props}
    >
      {children}
    </ListBox.Item>
  )
);
SelectItem.displayName = "SelectItem";

// ---------- Separator ----------
const SelectSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <Separator className={cn("-mx-1 my-1", className)} />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
