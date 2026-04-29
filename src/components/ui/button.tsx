"use client";

import * as React from "react";
import { Button as HeroUIButton, Spinner, buttonVariants } from "@heroui/react";
import { cn } from "@/lib/utils";

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") ref(value);
      else if (ref && typeof ref === "object" && "current" in ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export interface ButtonProps {
  variant?:
    | "default"
    | "primary"
    | "destructive"
    | "outline"
    | "outline-solid"
    | "secondary"
    | "subtle"
    | "ghost"
    | "link"
    | "soft"
    | "surface"
    | "classic"
    | "solid";
  size?: "sm" | "default" | "lg" | "icon" | "1" | "2" | "3" | "4";
  asChild?: boolean;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
  form?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: React.ReactNode;
  color?: string;
  title?: string;
  tabIndex?: number;
  "aria-label"?: string;
  "aria-expanded"?: boolean | "true" | "false";
  "aria-haspopup"?: boolean | "true" | "false" | "menu" | "listbox" | "tree" | "grid" | "dialog";
  id?: string;
  style?: React.CSSProperties;
}

const variantMap: Record<string, "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger"> = {
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

const sizeMap: Record<string, "sm" | "md" | "lg"> = {
  sm: "sm",
  default: "md",
  lg: "lg",
  icon: "md",
  "1": "sm",
  "2": "md",
  "3": "lg",
  "4": "lg",
};

/** HeroUI `Button` variant after `variantMap` — shared border/hover shell for `Button` and dialog triggers. */
export type HeroUIButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "ghost" | "danger";

const heroVariantBorderAndHover: Record<HeroUIButtonVariant, string> = {
  primary:
    "border border-primary/35 shadow-sm transition-[border-color,box-shadow] duration-150 dark:border-primary/45 data-[hovered=true]:border-primary/60 dark:data-[hovered=true]:border-primary/70",
  secondary:
    "border border-border/80 shadow-sm transition-[border-color,box-shadow] duration-150 data-[hovered=true]:border-primary/45",
  tertiary:
    "border border-border/70 shadow-sm transition-[border-color,box-shadow] duration-150 data-[hovered=true]:border-primary/38",
  outline:
    "border border-border/85 shadow-sm transition-[border-color,box-shadow] duration-150 data-[hovered=true]:border-primary/45",
  ghost:
    "border border-border/55 shadow-sm transition-[border-color,box-shadow] duration-150 dark:border-border/65 data-[hovered=true]:border-primary/40",
  danger:
    "border border-destructive/45 shadow-sm transition-[border-color,box-shadow] duration-150 data-[hovered=true]:border-destructive/85",
};

/** Layout + interaction ring/focus (use after `buttonVariants({ ... })`). */
export function heroUIButtonShellClasses(heroVariant: HeroUIButtonVariant): string {
  return cn(
    heroVariantBorderAndHover[heroVariant],
    "data-[hovered=true]:opacity-100 data-[pressed=true]:opacity-100",
    heroVariant === "danger"
      ? "data-[hovered=true]:shadow-md data-[hovered=true]:ring-2 data-[hovered=true]:ring-destructive/30"
      : "data-[hovered=true]:shadow-md data-[hovered=true]:ring-2 data-[hovered=true]:ring-primary/25",
    "focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      className,
      children,
      onClick,
      disabled,
      loading,
      type,
      form,
      color: _color,
      asChild: _asChild,
      ...props
    },
    ref
  ) => {
    const heroVariant = variantMap[variant as string] ?? "primary";
    const heroSize = sizeMap[size as string] ?? "md";
    const isIconOnly = size === "icon";
    const isAsChild = _asChild && React.isValidElement(children);
    const sharedClassName = cn(
      buttonVariants({
        isIconOnly,
        size: heroSize,
        variant: heroVariant,
      }),
      "inline-flex min-h-10 flex-row items-center justify-center gap-1.5 rounded-2xl text-center text-sm font-medium leading-tight whitespace-normal sm:min-h-11 sm:whitespace-nowrap",
      heroUIButtonShellClasses(heroVariant),
      (disabled || loading) && "pointer-events-none opacity-60",
      className
    );

    if (isAsChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      const childProps = child.props as {
        className?: string;
        onClick?: React.MouseEventHandler<HTMLElement>;
        children?: React.ReactNode;
      };
      const mergedOnClick: React.MouseEventHandler<HTMLElement> | undefined = disabled || loading
        ? (e) => e.preventDefault()
        : (e) => {
            onClick?.(e as React.MouseEvent<HTMLButtonElement>);
            childProps.onClick?.(e);
          };
      return React.cloneElement(child, {
        ...props,
        ...child.props,
        ref: mergeRefs(ref as React.Ref<HTMLButtonElement>, (child as React.ReactElement & { ref?: React.Ref<HTMLButtonElement> }).ref),
        className: cn(sharedClassName, childProps.className),
        "aria-disabled": disabled || loading ? true : undefined,
        onClick: mergedOnClick,
        children: loading ? (
          <span className="inline-flex items-center justify-center gap-1.5">
            <Spinner size="sm" className="mr-1" />
            {childProps.children}
          </span>
        ) : (
          childProps.children
        ),
      } as Record<string, unknown>);
    }

    const heroUiProps = props as Partial<React.ComponentProps<typeof HeroUIButton>> & {
      onPress?: (e: Parameters<NonNullable<React.ComponentProps<typeof HeroUIButton>["onPress"]>>[0]) => void;
    };
    const { onPress: onPressFromProps, ...restHeroProps } = heroUiProps;

    return (
      <HeroUIButton
        ref={ref}
        variant={heroVariant}
        size={heroSize}
        isIconOnly={isIconOnly}
        isDisabled={disabled || loading}
        type={type}
        form={form}
        className={sharedClassName}
        {...restHeroProps}
        onPress={
          onClick || onPressFromProps
            ? (e) => {
                onPressFromProps?.(e);
                if (onClick) onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
              }
            : undefined
        }
      >
        {loading && <Spinner size="sm" className="mr-1" />}
        {children}
      </HeroUIButton>
    );
  }
);
Button.displayName = "Button";

export { Button };
