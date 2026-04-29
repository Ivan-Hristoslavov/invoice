import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { loadCompanySettingsData } from "./company-data";
import { CompanySettingsProvider } from "./CompanySettingsContext";
import { CompanySettingsTabBar } from "./CompanySettingsTabBar";

export default async function CompanySettingsGroupLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }
  const { company, showCompanyLogoInPdf } = await loadCompanySettingsData(session);

  return (
    <CompanySettingsProvider company={company} showCompanyLogoInPdf={showCompanyLogoInPdf}>
      <CompanySettingsTabBar />
      {children}
    </CompanySettingsProvider>
  );
}
