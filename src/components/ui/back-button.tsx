"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";

type BackButtonProps = ComponentProps<typeof Button>;

export function BackButton({ children, ...props }: BackButtonProps) {
  const router = useRouter();
  return (
    <Button type="button" onClick={() => router.back()} {...props}>
      {children}
    </Button>
  );
}
