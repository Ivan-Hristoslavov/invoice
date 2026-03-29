"use client";

import { useRouter } from "next/navigation";
import { LogoUpload } from "@/components/forms/LogoUpload";

interface CompanyLogoSectionProps {
  currentLogoUrl: string | null;
  companyId: string;
}

export function CompanyLogoSection({ currentLogoUrl, companyId }: CompanyLogoSectionProps) {
  const router = useRouter();

  return (
    <LogoUpload
      currentLogoUrl={currentLogoUrl}
      companyId={companyId}
      onLogoUploaded={() => {
        // Refresh data after upload without full page reload
        router.refresh();
      }}
    />
  );
}
