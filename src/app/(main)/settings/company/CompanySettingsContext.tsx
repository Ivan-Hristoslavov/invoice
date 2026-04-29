"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CompanyRecord } from "./company-data";

type CompanySettingsValue = {
  company: CompanyRecord;
  showCompanyLogoInPdf: boolean;
  isNew: boolean;
};

const CompanySettingsContext = createContext<CompanySettingsValue | null>(null);

export function CompanySettingsProvider({
  company,
  showCompanyLogoInPdf,
  children,
}: {
  company: CompanyRecord;
  showCompanyLogoInPdf: boolean;
  children: ReactNode;
}) {
  const value: CompanySettingsValue = {
    company,
    showCompanyLogoInPdf,
    isNew: !company,
  };
  return (
    <CompanySettingsContext.Provider value={value}>{children}</CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) {
    throw new Error("useCompanySettings must be used under CompanySettingsProvider");
  }
  return ctx;
}
