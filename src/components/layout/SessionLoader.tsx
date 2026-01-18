"use client";

import { useSession } from "next-auth/react";
import { useRef } from "react";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface SessionLoaderProps {
  children: React.ReactNode;
}

export function SessionLoader({ children }: SessionLoaderProps) {
  const { status } = useSession();
  // Use ref to track if we've ever resolved - prevents re-showing loader
  const hasResolvedOnce = useRef(false);
  
  // Once session has resolved once, never show loader again
  if (status !== "loading") {
    hasResolvedOnce.current = true;
  }
  
  // Only show loader on initial load, never on subsequent navigations
  if (status === "loading" && !hasResolvedOnce.current) {
    return <FullPageLoader />;
  }
  
  return <>{children}</>;
}
