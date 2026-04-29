"use client";

import * as React from "react";
import { AlertDialog as HeroUIAlertDialog, buttonVariants } from "@heroui/react";
import { heroUIButtonShellClasses, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const variantToHero: Record<
  NonNullable<ButtonProps["variant"]>,
  "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger"
> = {
  default: "primary",
  primary: "primary",
  subtle: "tertiary",
  destructive: "danger",
  "outline-solid": "outline",
  outline: "outline",
  secondary: "secondary",
  ghost: "ghost",
  link: "ghost",
  soft: "tertiary",
  surface: "tertiary",
  classic: "primary",
  solid: "primary",
};

const sizeToHero: Record<NonNullable<ButtonProps["size"]>, "sm" | "md" | "lg"> = {
  sm: "sm",
  default: "md",
  lg: "lg",
  icon: "md",
  "1": "sm",
  "2": "md",
  "3": "lg",
  "4": "lg",
};

const triggerButtonLayout =
  "inline-flex min-h-10 flex-row items-center justify-center gap-1.5 rounded-2xl text-center text-sm font-medium leading-tight whitespace-normal sm:min-h-11 sm:whitespace-nowrap";

// ---------- Root ----------
interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

const AlertDialog = ({
  open,
  onOpenChange,
  defaultOpen,
  children,
}: AlertDialogProps) => (
  <HeroUIAlertDialog
    isOpen={open}
    defaultOpen={defaultOpen}
    onOpenChange={onOpenChange}
  >
    {children}
  </HeroUIAlertDialog>
);
AlertDialog.displayName = "AlertDialog";

// ---------- Trigger ----------
const AlertDialogTrigger = ({
  asChild: _asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}) => (
  <HeroUIAlertDialog.Trigger {...(props as Record<string, unknown>)}>
    {children}
  </HeroUIAlertDialog.Trigger>
);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

// ---------- Portal (no-op for compat) ----------
const AlertDialogPortal = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);

// ---------- Overlay (no-op – handled by Backdrop) ----------
const AlertDialogOverlay = () => null;

// ---------- Content ----------
const AlertDialogContent = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <HeroUIAlertDialog.Backdrop>
    <HeroUIAlertDialog.Container>
      <HeroUIAlertDialog.Dialog
        {...({
          ref,
          className: cn(
            "glass-card flex max-h-[min(90vh,720px)] w-[min(92vw,28rem)] flex-col overflow-hidden rounded-2xl border border-border/50 shadow-2xl outline-none",
            className
          ),
          ...props,
        } as React.ComponentProps<typeof HeroUIAlertDialog.Dialog>)}
      >
        {children}
      </HeroUIAlertDialog.Dialog>
    </HeroUIAlertDialog.Container>
  </HeroUIAlertDialog.Backdrop>
));
AlertDialogContent.displayName = "AlertDialogContent";

// ---------- Header ----------
const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <HeroUIAlertDialog.Header
    className={cn("flex min-h-0 flex-1 flex-col gap-2 p-6 pb-2", className)}
    {...(props as Record<string, unknown>)}
  />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

// ---------- Footer ----------
const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <HeroUIAlertDialog.Footer
    className={cn(
      "mt-auto flex shrink-0 flex-col gap-2 border-t border-border/50 bg-muted/20 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3 dark:bg-muted/10",
      className
    )}
    {...(props as Record<string, unknown>)}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

// ---------- Title ----------
const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <HeroUIAlertDialog.Heading
    ref={ref as React.Ref<HTMLHeadingElement>}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...(props as Record<string, unknown>)}
  />
));
AlertDialogTitle.displayName = "AlertDialogTitle";

// ---------- Description ----------
const AlertDialogDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </div>
));
AlertDialogDescription.displayName = "AlertDialogDescription";

type AlertDialogButtonProps = Omit<ButtonProps, "asChild" | "loading">;

// ---------- Action (closes dialog; single button — no nesting) ----------
const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogButtonProps
>(
  (
    {
      className,
      children,
      onClick,
      variant = "default",
      size = "default",
      disabled,
      type: _type,
      ...props
    },
    ref
  ) => {
    const heroVariant = variantToHero[variant] ?? "primary";
    const heroSize = sizeToHero[size] ?? "md";
    const isIconOnly = size === "icon";

    const ariaFromProps = (props as { "aria-label"?: string })["aria-label"];
    const accessibleLabel =
      ariaFromProps ?? (typeof children === "string" ? children : undefined);

    return (
      <HeroUIAlertDialog.CloseTrigger
        {...({
          ref,
          isDisabled: disabled,
          ...(accessibleLabel ? { "aria-label": accessibleLabel } : {}),
          className: cn(
            buttonVariants({
              variant: heroVariant,
              size: heroSize,
              isIconOnly,
            }),
            triggerButtonLayout,
            heroUIButtonShellClasses(heroVariant),
            disabled && "pointer-events-none opacity-60",
            className
          ),
          onPress: () => {
            onClick?.({} as React.MouseEvent<HTMLButtonElement>);
          },
          children,
          ...props,
          // HeroUI CloseTrigger defaults to slot "close" (top-right). Footer actions must not use that slot.
          slot: undefined,
        } as React.ComponentProps<typeof HeroUIAlertDialog.CloseTrigger>)}
      />
    );
  }
);
AlertDialogAction.displayName = "AlertDialogAction";

// ---------- Cancel ----------
const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  AlertDialogButtonProps
>(
  (
    { className, children, onClick, variant = "outline", size = "default", disabled, type: _type, ...props },
    ref
  ) => {
    const heroVariant = variantToHero[variant] ?? "outline";
    const heroSize = sizeToHero[size] ?? "md";
    const isIconOnly = size === "icon";

    const ariaFromProps = (props as { "aria-label"?: string })["aria-label"];
    const accessibleLabel =
      ariaFromProps ?? (typeof children === "string" ? children : undefined);

    return (
      <HeroUIAlertDialog.CloseTrigger
        {...({
          ref,
          isDisabled: disabled,
          ...(accessibleLabel ? { "aria-label": accessibleLabel } : {}),
          className: cn(
            buttonVariants({
              variant: heroVariant,
              size: heroSize,
              isIconOnly,
            }),
            triggerButtonLayout,
            heroUIButtonShellClasses(heroVariant),
            "mt-0 sm:mt-0",
            disabled && "pointer-events-none opacity-60",
            className
          ),
          onPress: () => {
            onClick?.({} as React.MouseEvent<HTMLButtonElement>);
          },
          children,
          ...props,
          slot: undefined,
        } as React.ComponentProps<typeof HeroUIAlertDialog.CloseTrigger>)}
      />
    );
  }
);
AlertDialogCancel.displayName = "AlertDialogCancel";

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
