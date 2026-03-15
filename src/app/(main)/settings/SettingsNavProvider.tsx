"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

type SettingsNavContextValue = {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
};

const SettingsNavContext = createContext<SettingsNavContextValue | null>(null);

export function useSettingsNav() {
  const ctx = useContext(SettingsNavContext);
  return ctx ?? { isPending: false, startTransition: (fn: () => void) => fn() };
}

export function SettingsNavProvider({ children }: { children: ReactNode }) {
  const [isPending, startTransition] = useTransition();
  return (
    <SettingsNavContext.Provider value={{ isPending, startTransition }}>
      {children}
    </SettingsNavContext.Provider>
  );
}
