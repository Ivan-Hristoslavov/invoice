"use client";

import * as React from "react";
import { Card as HeroUICard } from "@heroui/react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "secondary" | "tertiary" | "transparent" | "elevated" | "outlined" | "flat";
    /** compact = tighter radius/padding via consuming sections */
    density?: "comfortable" | "compact";
  }
>(({ className, variant, density, ...props }, ref) => {
  // Map app variant names to HeroUI Card variants
  const heroVariant =
    variant === "elevated" ? "default" :
    variant === "outlined" ? "secondary" :
    variant === "flat" ? "tertiary" :
    (variant as "default" | "secondary" | "tertiary" | "transparent") ?? "default";

  const densityClass = density === "compact" ? "rounded-2xl" : "rounded-3xl";

  return (
    <HeroUICard
      ref={ref}
      variant={heroVariant}
      className={cn(
        "glass-card overflow-hidden border border-border/60 shadow-sm transition-[border-color,box-shadow] duration-200",
        densityClass,
        className
      )}
      {...props}
    />
  );
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { density?: "comfortable" | "compact" }
>(({ className, density = "comfortable", ...props }, ref) => (
  <HeroUICard.Header
    ref={ref}
    className={cn(
      "flex flex-col gap-1.5",
      density === "compact" ? "p-3 sm:p-4" : "p-4 sm:p-5 md:p-6",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <HeroUICard.Title ref={ref} className={cn("card-title text-balance", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <HeroUICard.Description ref={ref} className={cn("card-description", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { density?: "comfortable" | "compact" }
>(({ className, density = "comfortable", ...props }, ref) => (
  <HeroUICard.Content
    ref={ref}
    className={cn(
      "min-w-0",
      density === "compact" ? "p-3 pt-0 sm:p-4 sm:pt-0" : "p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0",
      className
    )}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <HeroUICard.Footer ref={ref} className={cn("flex items-center gap-2 p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
