"use client";

import * as React from "react";
import { Modal as HeroUIModal } from "@heroui/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = ({
  open,
  onOpenChange,
  defaultOpen,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}) => (
  <HeroUIModal
    isOpen={open}
    defaultOpen={defaultOpen}
    onOpenChange={onOpenChange}
  >
    {children}
  </HeroUIModal>
);
Dialog.displayName = "Dialog";

const DialogTrigger = ({
  asChild: _asChild,
  children,
  ...props
}: {
  asChild?: boolean;
  children?: React.ReactNode;
  [key: string]: unknown;
}) => (
  <HeroUIModal.Trigger {...(props as any)}>
    {children}
  </HeroUIModal.Trigger>
);
const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const DialogClose = HeroUIModal.CloseTrigger;
const DialogOverlay = () => null;

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <HeroUIModal.Backdrop>
    <HeroUIModal.Container>
      <HeroUIModal.Dialog
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          "glass-card border border-border grid w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto gap-4 p-6 shadow-2xl sm:rounded-2xl relative",
          className
        )}
        {...(props as any)}
      >
        {children}
        <HeroUIModal.CloseTrigger
          className="absolute right-4 top-4 rounded-md p-1 text-foreground ring-offset-background transition-colors hover:bg-muted/90 hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none dark:text-foreground dark:hover:bg-muted"
          aria-label="Затвори"
        >
          <X className="h-4 w-4 shrink-0" aria-hidden="true" />
        </HeroUIModal.CloseTrigger>
      </HeroUIModal.Dialog>
    </HeroUIModal.Container>
  </HeroUIModal.Backdrop>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <HeroUIModal.Header
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...(props as any)}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <HeroUIModal.Footer
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...(props as any)}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <HeroUIModal.Heading
    ref={ref as any}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...(props as any)}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
