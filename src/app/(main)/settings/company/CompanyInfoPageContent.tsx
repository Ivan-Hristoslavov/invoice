"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { CompanyForm } from "./CompanyForm";
import { useCompanySettings } from "./CompanySettingsContext";
import { PageHeader } from "@/components/page";
import { InfoCallout } from "@/components/page/InfoCallout";

export function CompanyInfoPageContent() {
  const { company, isNew } = useCompanySettings();

  return (
    <div>
      <PageHeader
        title="Компания"
        description="Основни данни, адрес и данъчна информация за фактури"
        className="mb-4"
      />
      <Card density="comfortable" className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle>Информация за компанията</CardTitle>
              <CardDescription>ЕИК, МОЛ, ДДС и легален адрес за издаване на фактури</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-3">
            <InfoCallout helpKey="eik" />
            <InfoCallout helpKey="mol" />
            <InfoCallout helpKey="vatId" />
          </div>
          <CompanyForm
            defaultValues={{
              id: company?.id || "",
              name: company?.name || "",
              email: company?.email || "",
              phone: company?.phone || "",
              address: company?.address || "",
              city: company?.city || "",
              state: company?.state || "",
              zipCode: company?.zipCode || "",
              country: company?.country || "",
              vatNumber: company?.vatNumber || "",
              taxIdNumber: company?.taxIdNumber || "",
              registrationNumber: company?.registrationNumber || "",
              bulstatNumber: company?.bulstatNumber || "",
              vatRegistered: company?.vatRegistered ?? false,
              vatRegistrationNumber: company?.vatRegistrationNumber || "",
              mol: company?.mol || "",
              accountablePerson: company?.accountablePerson || "",
              uicType: company?.uicType || "BULSTAT",
              viesLastCheckAt: company?.viesLastCheckAt ?? null,
              viesValid: company?.viesValid ?? null,
              viesCountryCode: company?.viesCountryCode ?? null,
              viesNumberLocal: company?.viesNumberLocal ?? null,
              viesTraderName: company?.viesTraderName ?? null,
              viesTraderAddress: company?.viesTraderAddress ?? null,
            }}
            isNewCompany={isNew}
          />
        </CardContent>
      </Card>
    </div>
  );
}
