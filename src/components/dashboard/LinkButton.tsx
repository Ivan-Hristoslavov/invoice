"use client";

import Link from "next/link";
import { Button, type ButtonProps } from "@/components/ui/button";

export type LinkButtonProps = Omit<ButtonProps, "asChild"> & {
  href: string;
  linkClassName?: string;
};

/**
 * HeroUI Button + Next.js Link must live in a Client Component when used from a Server Component,
 * otherwise SSR can emit a &lt;button&gt; while the client merges into &lt;a&gt; and hydration fails.
 */
export function LinkButton({ href, linkClassName, children, ...buttonProps }: LinkButtonProps) {
  return (
    <Button asChild {...buttonProps}>
      <Link href={href} className={linkClassName}>
        {children}
      </Link>
    </Button>
  );
}
