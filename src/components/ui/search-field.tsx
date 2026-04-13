"use client";

import * as React from "react";
import { SearchField as HeroSearchField } from "@heroui/react";
import { cn } from "@/lib/utils";

export type SearchFieldProps = Omit<
  React.ComponentProps<typeof HeroSearchField>,
  "children"
> & {
  /** Visible label (uses screen-reader-only wrapper when set). Prefer `aria-label` for icon-only search. */
  label?: string;
  placeholder?: string;
  children?: React.ReactNode;
};

/**
 * HeroUI SearchField with app tokens. Default composition: group + icon + input + clear.
 */
function SearchFieldRoot({
  className,
  fullWidth = true,
  variant = "secondary",
  label,
  placeholder,
  children,
  ...props
}: SearchFieldProps) {
  const content =
    children ??
    (
      <>
        <HeroSearchField.Group className="min-w-0">
          <HeroSearchField.SearchIcon />
          <HeroSearchField.Input placeholder={placeholder} />
          <HeroSearchField.ClearButton />
        </HeroSearchField.Group>
      </>
    );

  return (
    <HeroSearchField
      fullWidth={fullWidth}
      variant={variant}
      className={cn("min-w-0", className)}
      {...props}
    >
      {label ? (
        <>
          <span className="sr-only">{label}</span>
          {content}
        </>
      ) : (
        content
      )}
    </HeroSearchField>
  );
}

export const SearchField = Object.assign(SearchFieldRoot, {
  Group: HeroSearchField.Group,
  Input: HeroSearchField.Input,
  SearchIcon: HeroSearchField.SearchIcon,
  ClearButton: HeroSearchField.ClearButton,
});
