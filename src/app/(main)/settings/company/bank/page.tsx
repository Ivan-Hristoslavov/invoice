"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyForm } from "../CompanyForm";
import { useCompanySettings } from "../CompanySettingsContext";
import { PageHeader } from "@/components/page";
import { CreditCard } from "lucide-react";
import { InfoCallout } from "@/components/page/InfoCallout";

export default function CompanyBankPage() {
  const router = useRouter();
  const { company, isNew } = useCompanySettings();

  useEffect(() => {
    if (isNew) {
      router.replace("/settings/company");
    }
  }, [isNew, router]);

  if (isNew) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Банкова информация"
        description="IBAN и банка за плащания по фактури"
        className="mb-4"
      />
      <Card density="comfortable" className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <CreditCard className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle>Банка</CardTitle>
              <CardDescription>
                IBAN и BIC/SWIFT за мрежата на банката. За български IBAN често BIC не е задължителен за вътрешни преводи.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InfoCallout helpKey="bankIban" className="mb-4" />
          <CompanyForm
            defaultValues={{
              id: company?.id || "",
              bankName: company?.bankName || "",
              bankSwift: company?.bankSwift || "",
              bankIban: company?.bankIban || "",
            }}
            isBankInfo
            isNewCompany={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
