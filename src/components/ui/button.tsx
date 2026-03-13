"use client";

import * as React from "react";
import { Button as HeroUIButton, Spinner } from "@heroui/react";

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

    return (
      <HeroUIButton
        ref={ref}
        variant={heroVariant}
        size={heroSize}
        isIconOnly={isIconOnly}
        isDisabled={disabled || loading}
        type={type}
        form={form}
        className={[
          className,
          "inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap",
        ]
          .filter(Boolean)
          .join(" ")}
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
