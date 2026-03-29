"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

type SidebarContextValue = {
  isOpen: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const LAYOUT_BREAKPOINT = 1024;

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth < LAYOUT_BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const setOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsOpen(value);
  }, []);

  return (
    <SidebarContext.Provider value={{ isOpen, setOpen, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return ctx;
}
