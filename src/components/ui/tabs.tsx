"use client";

import * as React from "react";
import { Tabs as HeroUITabs } from "@heroui/react";
import { cn } from "@/lib/utils";

// Map controlled value/defaultValue to HeroUI Tabs (selectedKey/defaultSelectedKey)
const Tabs = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof HeroUITabs>, "selectedKey" | "defaultSelectedKey" | "onSelectionChange"> & {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  }
>(({ value, defaultValue, onValueChange, className, ...props }, ref) => (
  <HeroUITabs
    ref={ref}
    selectedKey={value}
    defaultSelectedKey={defaultValue}
    onSelectionChange={(key) => onValueChange?.(String(key))}
    className={className}
    {...props}
  />
));
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUITabs.List>
>(({ className, ...props }, ref) => (
  <HeroUITabs.List ref={ref} className={className} {...props} />
));
TabsList.displayName = "TabsList";

// Map value → id for React Aria compatibility
const TabsTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof HeroUITabs.Tab>, "id"> & {
    value?: string;
    id?: string;
  }
>(({ value, id, className, ...props }, ref) => (
  <HeroUITabs.Tab
    ref={ref as any}
    id={id ?? value ?? ""}
    className={cn(
      "transition-colors data-[selected=true]:text-primary-foreground data-[selected=false]:text-foreground/65 data-[selected=false]:hover:text-foreground dark:data-[selected=false]:text-foreground/55",
      "[&_svg]:shrink-0 data-[selected=true]:[&_svg]:text-primary-foreground data-[selected=false]:[&_svg]:text-foreground/60",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

// Map value → id for React Aria compatibility
const TabsContent = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof HeroUITabs.Panel>, "id"> & { value?: string; id?: string }
>(({ value, id, className, ...props }, ref) => (
  <HeroUITabs.Panel ref={ref} id={id ?? value ?? ""} className={className} {...props} />
));
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
