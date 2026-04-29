"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyLogoSection } from "../CompanyLogoSection";
import { useCompanySettings } from "../CompanySettingsContext";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { PageHeader } from "@/components/page";
import { Image, Lock } from "lucide-react";

export default function CompanyLogoPage() {
  const router = useRouter();
  const { company, isNew, showCompanyLogoInPdf } = useCompanySettings();
  const { canUseFeature } = useSubscriptionLimit();
  const canUseLogo = canUseFeature("customBranding");

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
        title="Лого"
        description="Качване и показ на логото в PDF (по план Pro)"
        className="mb-4"
      />
      <Card density="comfortable" className="border-border/60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Image className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle>Лого на компанията</CardTitle>
              <CardDescription>
                Логото за фактури и съвместно с настройките в „Предпочитания за фактури“
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {canUseLogo ? (
            <CompanyLogoSection
              currentLogoUrl={company?.logo ?? null}
              companyId={company?.id || ""}
              showCompanyLogoInPdf={showCompanyLogoInPdf}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-6 py-10 text-center dark:border-amber-700 dark:bg-amber-950/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium">Логото е Pro функция</p>
                <p className="mt-1 text-xs text-muted-foreground">Налично в плановете Pro и Business</p>
              </div>
              <Button asChild size="sm" variant="outline" className="border-amber-300 dark:border-amber-700">
                <Link href="/settings/subscription">Надгради плана</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
