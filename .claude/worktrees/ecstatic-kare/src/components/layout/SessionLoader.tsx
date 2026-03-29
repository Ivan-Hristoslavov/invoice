"use client";

import { useSession } from "next-auth/react";
import { useRef, useState, useEffect } from "react";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface SessionLoaderProps {
  children: React.ReactNode;
}

export function SessionLoader({ children }: SessionLoaderProps) {
  const { status } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [shouldShowLoader, setShouldShowLoader] = useState(false);
  // Use ref to track if we've ever resolved - prevents re-showing loader
  const hasResolvedOnce = useRef(false);
  
  // Only render loader after client-side hydration to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Once session has resolved once, never show loader again
  if (status !== "loading") {
    hasResolvedOnce.current = true;
  }
  
  // After hydration, decide if we should show loader
  useEffect(() => {
    if (!isMounted) return;
    if (status === "loading" && !hasResolvedOnce.current) {
      setShouldShowLoader(true);
      return;
    }
    setShouldShowLoader(false);
  }, [isMounted, status]);
  
  // During SSR or initial mount, always show children to prevent hydration mismatch
  if (!isMounted) {
    return <>{children}</>;
  }
  
  // Only show loader on initial load after hydration, never on subsequent navigations
  if (shouldShowLoader) {
    return <FullPageLoader />;
  }
  
  return <>{children}</>;
}
