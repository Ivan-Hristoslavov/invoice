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
    | "destructive"
    | "outline"
    | "outline-solid"
    | "secondary"
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
        onPress={
          onClick
            ? (e) => onClick(e as unknown as React.MouseEvent<HTMLButtonElement>)
            : undefined
        }
        {...(props as Partial<React.ComponentProps<typeof HeroUIButton>>)}
      >
        {loading && <Spinner size="sm" className="mr-1" />}
        {children}
      </HeroUIButton>
    );
  }
);
Button.displayName = "Button";

export { Button };
