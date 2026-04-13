"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoUpload } from "@/components/forms/LogoUpload";

interface CompanyLogoSectionProps {
  currentLogoUrl: string | null;
  companyId: string;
  showCompanyLogoInPdf: boolean;
}

export function CompanyLogoSection({
  currentLogoUrl,
  companyId,
  showCompanyLogoInPdf,
}: CompanyLogoSectionProps) {
  const router = useRouter();
  const [displayLogoUrl, setDisplayLogoUrl] = useState<string | null>(currentLogoUrl);

  useEffect(() => {
    setDisplayLogoUrl(currentLogoUrl);
  }, [currentLogoUrl]);

  return (
    <LogoUpload
      currentLogoUrl={displayLogoUrl}
      companyId={companyId}
      showCompanyLogoInPdf={showCompanyLogoInPdf}
      onLogoUploaded={(logoUrl) => {
        setDisplayLogoUrl(logoUrl ? logoUrl : null);
        router.refresh();
      }}
    />
  );
}
