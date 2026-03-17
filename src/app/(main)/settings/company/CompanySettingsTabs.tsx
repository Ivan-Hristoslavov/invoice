"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CompanyForm } from "./CompanyForm";
import { CompanyLogoSection } from "./CompanyLogoSection";
import { Building2, MapPin, Receipt, CreditCard, Image, Lock } from "lucide-react";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";

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
  const { canUseFeature } = useSubscriptionLimit();
  const canUseLogo = canUseFeature('customBranding');

  return (
    <Tabs defaultValue="info" className="w-full">
      <div className="mb-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <TabsList className="flex min-w-max gap-2 rounded-2xl border border-border/60 bg-card/70 p-1">
        <TabsTrigger value="info" className="min-h-10 whitespace-nowrap rounded-xl px-3">
          <Building2 className="h-4 w-4 mr-2" />
          Основни
        </TabsTrigger>
        {!isNew && (
          <TabsTrigger value="bank" className="min-h-10 whitespace-nowrap rounded-xl px-3">
            <CreditCard className="h-4 w-4 mr-2" />
            Банка
          </TabsTrigger>
        )}
        {!isNew && (
          <TabsTrigger value="logo" className="min-h-10 whitespace-nowrap rounded-xl px-3">
            <Image className="h-4 w-4 mr-2" />
            Лого
          </TabsTrigger>
        )}
      </TabsList>
      </div>

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

      {!isNew && (
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
      )}

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
              {canUseLogo ? (
                <CompanyLogoSection
                  currentLogoUrl={company?.logo ?? null}
                  companyId={company?.id || ""}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-6 py-10 text-center dark:border-amber-700 dark:bg-amber-950/20">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                    <Lock className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Логото е Pro функция</p>
                    <p className="mt-1 text-xs text-muted-foreground">Налично в плановете Pro и Business</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-amber-300 dark:border-amber-700">
                    <Link href="/settings/subscription">Надгради плана</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}
