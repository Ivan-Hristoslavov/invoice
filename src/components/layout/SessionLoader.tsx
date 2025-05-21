"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { FullPageLoader } from "@/components/ui/loading-spinner";

interface SessionLoaderProps {
  children: React.ReactNode;
}

export function SessionLoader({ children }: SessionLoaderProps) {
  const { status } = useSession();
  const [showLoader, setShowLoader] = useState(true);
  
  // Използваме useEffect за да избегнем хидратация грешки
  useEffect(() => {
    if (status !== "loading") {
      // Добавяме малко забавяне за по-плавен преход
      const timeout = setTimeout(() => {
        setShowLoader(false);
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [status]);
  
  if (showLoader) {
    return <FullPageLoader />;
  }
  
  return <>{children}</>;
} 