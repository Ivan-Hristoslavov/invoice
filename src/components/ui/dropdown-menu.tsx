"use client";

import * as React from "react";
import { Dropdown, Separator } from "@heroui/react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM_CLASS =
  "relative flex min-h-9 w-full cursor-default select-none items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50";

/** При asChild реалният елемент е Link/<a> — същият ред като menu item: gap-3, икона + етикет. */
const AS_CHILD_TRIGGER_CLASS = "flex w-full min-w-0 items-center gap-3 no-underline outline-none";

/** Фиксирана 16×16 клетка за икони — подравнява всички редове в менюто. */
function DropdownMenuItemIcon({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex size-4 shrink-0 items-center justify-center text-current [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      aria-hidden
      {...props}
    >
      {children}
    </span>
  );
}
DropdownMenuItemIcon.displayName = "DropdownMenuItemIcon";

/** Етикет до иконата — еднакъв ред и пренасяне. */
function DropdownMenuItemText({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("min-w-0 flex-1 text-left leading-snug", className)} {...props} />;
}
DropdownMenuItemText.displayName = "DropdownMenuItemText";

function textFromAsChildMenuChildren(node: React.ReactNode): string | undefined {
  const parts: string[] = [];
  React.Children.forEach(node, (c) => {
    if (typeof c === "string" || typeof c === "number") {
      parts.push(String(c));
      return;
    }
    if (!React.isValidElement<{ children?: React.ReactNode }>(c)) return;
    if ((c.type as { displayName?: string }).displayName === "DropdownMenuItemText") {
      const inner = c.props.children;
      if (typeof inner === "string" || typeof inner === "number") parts.push(String(inner));
    }
  });
  return parts.length ? parts.join(" ") : undefined;
}

/** React Aria / HeroUI menu item render props — must not reach a real DOM node when using asChild + Next.js Link. */
const MENU_ITEM_DOM_LEAK_KEYS = new Set([
  "defaultChildren",
  "hasSubmenu",
  "isDisabled",
  "isFocusVisible",
  "isFocused",
  "isHovered",
  "isOpen",
  "isPressed",
  "isSelected",
  "selectionBehavior",
  "selectionMode",
]);

function omitMenuItemDomLeakProps(props: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!MENU_ITEM_DOM_LEAK_KEYS.has(key)) next[key] = props[key];
  }
  return next;
}

type DropdownRootProps = React.ComponentProps<typeof Dropdown>;

interface DropdownMenuProps extends Omit<DropdownRootProps, "isOpen" | "onOpenChange"> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DropdownMenu = ({ open, onOpenChange, children, ...props }: DropdownMenuProps) => (
  <Dropdown isOpen={open} onOpenChange={onOpenChange} {...props}>
    {children}
  </Dropdown>
);
DropdownMenu.displayName = "DropdownMenu";

/**
 * HeroUI Dropdown.Trigger винаги рендерира един <button> (react-aria).
 * Не подавайте вътрешен <Button> — това дава button в button и hydration грешка.
 * Стиловете подайте през className; съдържанието — икони/текст без допълнителен бутон.
 */
const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  Omit<React.ComponentProps<typeof Dropdown.Trigger>, "children" | "asChild"> & {
    children?: React.ReactNode;
  }
>(({ children, className, ...props }, ref) => (
  <Dropdown.Trigger ref={ref} className={className} {...props}>
    {children}
  </Dropdown.Trigger>
));
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

function mapAlignToPlacement(align?: "start" | "end" | "center"): "bottom start" | "bottom end" | "bottom" {
  if (align === "end") return "bottom end";
  if (align === "start") return "bottom start";
  return "bottom";
}

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Dropdown.Popover>, "children"> & {
    align?: "start" | "end" | "center";
    sideOffset?: number;
    children?: React.ReactNode;
  }
>(({ className, align = "center", sideOffset = 4, children, ...props }, ref) => (
  <Dropdown.Popover
    ref={ref}
    placement={mapAlignToPlacement(align)}
    offset={sideOffset}
    className={cn(
      "z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg outline-none",
      className
    )}
    {...props}
  >
    <Dropdown.Menu className="max-h-[min(70vh,420px)] overflow-y-auto p-1.5 outline-none">{children}</Dropdown.Menu>
  </Dropdown.Popover>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  Omit<React.ComponentProps<typeof Dropdown.Item>, "children" | "onAction"> & {
    inset?: boolean;
    destructive?: boolean;
    onClick?: (e: React.MouseEvent | React.SyntheticEvent) => void;
    asChild?: boolean;
    children?: React.ReactNode;
  }
>(({ className, inset, destructive, onClick, asChild, children, onPointerDown, ...props }, ref) => {
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e);
    e.stopPropagation();
  };

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<Record<string, unknown>>;
    return (
      <Dropdown.Item
        ref={ref}
        className={cn(
          ITEM_CLASS,
          inset && "pl-8",
          destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive",
          className
        )}
        textValue={
          textFromAsChildMenuChildren(child.props.children as React.ReactNode) ??
          (typeof child.props.children === "string" ? child.props.children : undefined)
        }
        onAction={() => {
          const ev = {
            stopPropagation: () => {},
            preventDefault: () => {},
          } as unknown as React.MouseEvent;
          onClick?.(ev);
        }}
        onPointerDown={handlePointerDown}
        {...props}
      >
        {(itemProps: unknown) =>
          React.cloneElement(child, {
            ...omitMenuItemDomLeakProps(itemProps as Record<string, unknown>),
            ...child.props,
            className: cn(
              AS_CHILD_TRIGGER_CLASS,
              (child.props as { className?: string }).className,
              className
            ),
            onClick: (e: React.MouseEvent) => {
              onClick?.(e);
              (child.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
            },
          } as Record<string, unknown>)
        }
      </Dropdown.Item>
    );
  }

  return (
    <Dropdown.Item
      ref={ref}
      className={cn(
        ITEM_CLASS,
        inset && "pl-8",
        destructive && "text-destructive focus:bg-destructive/10 focus:text-destructive",
        className
      )}
      onAction={onClick ? () => onClick({} as React.MouseEvent) : undefined}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </Dropdown.Item>
  );
});
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Dropdown.Item> & {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    children?: React.ReactNode;
  }
>(({ className, children, checked, onCheckedChange, ...props }, ref) => (
  <Dropdown.Item
    ref={ref}
    className={cn(ITEM_CLASS, "gap-3 pl-9", className)}
    onAction={() => onCheckedChange?.(!checked)}
    {...props}
  >
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
      {checked ? <Check className="h-4 w-4" aria-hidden /> : null}
    </span>
    {children}
  </Dropdown.Item>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Dropdown.Item> & {
    children?: React.ReactNode;
  }
>(({ className, children, ...props }, ref) => (
  <Dropdown.Item ref={ref} className={cn(ITEM_CLASS, "gap-3 pl-9", className)} {...props}>
    <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
      <span className="h-2 w-2 rounded-full border border-current opacity-70" />
    </span>
    {children}
  </Dropdown.Item>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
  <Separator ref={ref} className={cn("my-1.5 h-px bg-border/80", className)} {...props} />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span aria-hidden="true" className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
);
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

/** @deprecated Prefer HeroUI <Dropdown.SubmenuTrigger> composition; kept for API compatibility. */
const DropdownMenuSub = ({ children }: { children?: React.ReactNode }) => {
  const ch = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement[];
  const subTrigger = ch[0];
  const subContent = ch[1];
  if (!subTrigger) return null;
  return (
    <Dropdown.SubmenuTrigger>
      {subTrigger}
      <Dropdown.Popover placement="right top" offset={4} className="z-50 min-w-32 overflow-hidden rounded-xl border border-border bg-popover p-0 shadow-lg">
        <Dropdown.Menu className="p-1.5">{subContent ?? null}</Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.SubmenuTrigger>
  );
};

const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Dropdown.Item> & {
    inset?: boolean;
    children?: React.ReactNode;
  }
>(({ className, inset, children, ...props }, ref) => (
  <Dropdown.Item
    ref={ref}
    className={cn(ITEM_CLASS, inset && "pl-8", className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" aria-hidden />
  </Dropdown.Item>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

const DropdownMenuSubContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <div className={cn("p-1", className)}>{children}</div>
);
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

const DropdownMenuGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioGroup = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div role="radiogroup" className={cn(className)} {...props}>
    {children}
  </div>
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIcon,
  DropdownMenuItemText,
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
