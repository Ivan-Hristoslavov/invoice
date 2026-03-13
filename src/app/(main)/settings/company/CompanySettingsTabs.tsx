"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompanyForm } from "./CompanyForm";
import { CompanyLogoSection } from "./CompanyLogoSection";
import { Building2, MapPin, Receipt, CreditCard, Image } from "lucide-react";

interface CompanyData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  vatNumber?: string;
  taxIdNumber?: string;
  registrationNumber?: string;
  bulstatNumber?: string;
  vatRegistered?: boolean;
  vatRegistrationNumber?: string;
  mol?: string;
  accountablePerson?: string;
  uicType?: "BULSTAT" | "EGN";
  bankName?: string;
  bankAccount?: string;
  bankSwift?: string;
  bankIban?: string;
  logo?: string;
}

interface CompanySettingsTabsProps {
  company: CompanyData | null;
}

export function CompanySettingsTabs({ company }: CompanySettingsTabsProps) {
  const isNew = !company;

  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="info">
          <Building2 className="h-4 w-4 mr-2" />
          Основни
        </TabsTrigger>
        <TabsTrigger value="bank">
          <CreditCard className="h-4 w-4 mr-2" />
          Банка
        </TabsTrigger>
        {!isNew && (
          <TabsTrigger value="logo">
            <Image className="h-4 w-4 mr-2" />
            Лого
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="info">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle>Информация за компанията</CardTitle>
                <CardDescription>
                  Основни данни, адрес и данъчна информация за фактури
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
              }}
              isNewCompany={isNew}
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bank">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle>Банкова информация</CardTitle>
                <CardDescription>
                  Банковите ви детайли ще се показват на фактурите
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CompanyForm
              defaultValues={{
                id: company?.id || "",
                bankName: company?.bankName || "",
                bankAccount: company?.bankAccount || "",
                bankSwift: company?.bankSwift || "",
                bankIban: company?.bankIban || "",
              }}
              isBankInfo={true}
              isNewCompany={isNew}
            />
          </CardContent>
        </Card>
      </TabsContent>

      {!isNew && (
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Image className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <CardTitle>Лого на компанията</CardTitle>
                  <CardDescription>
                    Качете лого, което ще се показва на фактурите
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CompanyLogoSection
                currentLogoUrl={company?.logo}
                companyId={company?.id || ""}
              />
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
