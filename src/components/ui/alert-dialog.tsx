"use client";

import * as React from "react";
import { AlertDialog as HeroUIAlertDialog } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  <HeroUIAlertDialog.Trigger {...(props as any)}>
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
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <HeroUIAlertDialog.Backdrop>
    <HeroUIAlertDialog.Container>
      <HeroUIAlertDialog.Dialog>
        <div
          ref={ref}
          className={cn(
            "glass-card w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-0",
            className
          )}
          {...props}
        >
          {children}
        </div>
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
    className={cn("flex flex-col space-y-2 p-6 pb-0", className)}
    {...(props as any)}
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
      "flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-6 pt-4",
      className
    )}
    {...(props as any)}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

// ---------- Title ----------
const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <HeroUIAlertDialog.Heading
    ref={ref as any}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...(props as any)}
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
    className={cn("px-6 py-4 text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </div>
));
AlertDialogDescription.displayName = "AlertDialogDescription";

// ---------- Action (closes dialog after click) ----------
const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, children, onClick, ...props }, ref) => (
  <HeroUIAlertDialog.CloseTrigger>
    <Button
      ref={ref}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  </HeroUIAlertDialog.CloseTrigger>
));
AlertDialogAction.displayName = "AlertDialogAction";

// ---------- Cancel ----------
const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, children, ...props }, ref) => (
  <HeroUIAlertDialog.CloseTrigger>
    <Button
      ref={ref}
      variant="outline"
      className={cn("mt-2 sm:mt-0", className)}
      {...props}
    >
      {children}
    </Button>
  </HeroUIAlertDialog.CloseTrigger>
));
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
