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
    /** Visual style for the tab list (applied via classNames on list from children) */
    variant?: "default" | "pills" | "underline" | "segmented";
  }
>(({ value, defaultValue, onValueChange, className, variant, ...props }, ref) => {
  void variant;
  return (
  <HeroUITabs
    ref={ref}
    selectedKey={value}
    defaultSelectedKey={defaultValue}
    onSelectionChange={(key) => onValueChange?.(String(key))}
    className={className}
    {...props}
  />
  );
});
Tabs.displayName = "Tabs";

const tabsListVariantClass = (variant: "default" | "pills" | "underline" | "segmented" | undefined) => {
  switch (variant) {
    case "pills":
      return "gap-1 overflow-x-auto pb-0.5 scrollbar-none min-w-0";
    case "underline":
      return "gap-0 border-b border-border/70 pb-0";
    case "segmented":
      return "gap-0.5 w-full min-w-0 p-1";
    default:
      return "";
  }
};

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUITabs.List> & { variant?: "default" | "pills" | "underline" | "segmented" }
>(({ className, variant = "default", ...props }, ref) => (
  <HeroUITabs.List
    ref={ref}
    className={cn(tabsListVariantClass(variant), className)}
    {...props}
  />
));
TabsList.displayName = "TabsList";

// Map value → id for React Aria compatibility
const TabsTrigger = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof HeroUITabs.Tab>, "id"> & {
    value?: string;
    id?: string;
    listVariant?: "default" | "pills" | "underline" | "segmented";
  }
>(({ value, id, className, listVariant, ...props }, ref) => (
  <HeroUITabs.Tab
    ref={ref as any}
    id={id ?? value ?? ""}
    className={cn(
      "min-h-10 px-3 transition-colors",
      listVariant === "pills" &&
        "shrink-0 rounded-full data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:shadow-sm data-[selected=false]:text-foreground/85 data-[selected=false]:hover:bg-muted/80",
      listVariant === "underline" &&
        "rounded-none border-b-2 border-transparent -mb-px data-[selected=true]:border-primary data-[selected=true]:text-primary data-[selected=false]:text-muted-foreground",
      listVariant === "segmented" &&
        "flex-1 min-w-0 justify-center rounded-xl data-[selected=true]:bg-background data-[selected=true]:text-foreground data-[selected=true]:shadow-sm",
      (listVariant === "default" || !listVariant) &&
        "rounded-xl data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:shadow-sm data-[selected=false]:text-foreground data-[selected=false]:hover:bg-muted/60",
      "[&_svg]:shrink-0",
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
