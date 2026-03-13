"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type BackButtonProps = ComponentProps<typeof Button>;

export function BackButton({ children, className, ...props }: BackButtonProps) {
  const router = useRouter();
  return (
    <Button
      type="button"
      onClick={() => router.back()}
      className={[className, "whitespace-nowrap"].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </Button>
  );
}
