"use client";

import * as React from "react";
import {
  Dropdown as HeroUIDropdown,
  Popover as HeroUIPopover,
  Separator,
} from "@heroui/react";
import { cn } from "@/lib/utils";

// ---------- Root ----------
// Wraps HeroUI Popover (DialogTrigger) for flexible open/close
const DropdownMenu = HeroUIPopover;

// ---------- Trigger ----------
// Wraps Popover.Trigger (a div) – children must include a pressable element
const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof HeroUIPopover.Trigger> & { asChild?: boolean }
>(({ className, children, asChild: _asChild, ...props }, ref) => (
  <HeroUIPopover.Trigger
    ref={ref}
    className={cn("cursor-pointer", className)}
    {...props}
  >
    {children}
  </HeroUIPopover.Trigger>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

// ---------- Content ----------
type Align = "start" | "end" | "center";

interface DropdownMenuContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  align?: Align;
  sideOffset?: number;
  children?: React.ReactNode;
  className?: string;
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ align = "start", className, children, sideOffset = 4, ...props }, ref) => {
  const placement =
    align === "end" ? "bottom end" : align === "center" ? "bottom" : "bottom start";
  return (
    <HeroUIPopover.Content
      placement={placement}
      offset={sideOffset}
      className={cn(
        "z-[100] overflow-hidden rounded-xl border border-border bg-popover shadow-lg p-1 min-w-[8rem]",
        className
      )}
    >
      <HeroUIPopover.Dialog>
        <div ref={ref} {...props}>
          {children}
        </div>
      </HeroUIPopover.Dialog>
    </HeroUIPopover.Content>
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

// ---------- Item ----------
interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean;
  destructive?: boolean;
  asChild?: boolean;
}

const ITEM_CLASS =
  "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground";

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, inset, destructive, asChild, onClick, children, ...props }, ref) => {
    const itemClass = cn(
      ITEM_CLASS,
      inset && "pl-8",
      destructive && "text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive",
      className
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string; ref?: React.Ref<unknown> }>, {
        ref,
        className: cn(itemClass, (children as React.ReactElement<{ className?: string }>).props.className),
      });
    }

    return (
      <div
        ref={ref}
        role="menuitem"
        tabIndex={0}
        className={itemClass}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

// ---------- Checkbox Item ----------
const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps & { checked?: boolean }
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuItem ref={ref} className={cn("pl-8", className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      {checked && (
        <svg viewBox="0 0 8 8" className="h-3 w-3 fill-current">
          <path d="M1 4l2 2 4-4" />
        </svg>
      )}
    </span>
    {children}
  </DropdownMenuItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// ---------- Radio Group & Item ----------
const DropdownMenuRadioGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps & { value?: string }
>(({ className, children, ...props }, ref) => (
  <DropdownMenuItem ref={ref} className={cn("pl-8", className)} {...props}>
    {children}
  </DropdownMenuItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// ---------- Label ----------
const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// ---------- Separator ----------
const DropdownMenuSeparator = React.forwardRef<
  HTMLHRElement,
  React.HTMLAttributes<HTMLHRElement>
>(({ className, ...props }, ref) => (
  <Separator className={cn("-mx-1 my-1", className)} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ---------- Shortcut ----------
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
    {...props}
  />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// ---------- Group ----------
const DropdownMenuGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// ---------- Portal ----------
const DropdownMenuPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// ---------- Sub (not supported – no-op) ----------
const DropdownMenuSub = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ className, children, ...props }, ref) => (
  <DropdownMenuItem ref={ref} className={cn("pr-8", className)} {...props}>
    {children}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="ml-auto h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </DropdownMenuItem>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-[100] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
