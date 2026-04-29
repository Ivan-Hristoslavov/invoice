"use client";

import { ReactNode } from "react";
import { PageContainer } from "@/components/page";

/**
 * Settings content wrapper — navigation lives in the main app sidebar.
 */
export function SettingsLayoutClient({ children }: { children: ReactNode }) {
  return (
    <PageContainer className="max-w-6xl pb-8 sm:pb-10">
      <div className="w-full min-w-0">{children}</div>
    </PageContainer>
  );
}
