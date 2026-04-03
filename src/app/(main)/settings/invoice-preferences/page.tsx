import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InvoicePreferencesForm } from "./InvoicePreferencesForm";

export const metadata: Metadata = {
  title: `Настройки на фактури | ${APP_NAME}`,
  description: "Настройте предпочитанията си за фактури и ДДС",
};

export default async function InvoicePreferencesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <Card className="glass-card w-full rounded-[28px] border border-border/40 shadow-sm">
      <CardHeader className="space-y-1 pb-4 sm:pb-5">
        <CardTitle className="text-lg sm:text-xl">Настройки на фактури</CardTitle>
        <CardDescription className="max-w-3xl leading-relaxed">
          ДДС, валута, <strong className="font-medium text-foreground">по желание префикс преди номера</strong> (напр.{" "}
          <span className="font-mono text-sm">Ф-</span> или <span className="font-mono text-sm">ФАК-</span>), непрекъсната номерация и начален номер при миграция,
          текстове по подразбиране и показване в PDF — запазват се в профила ви. Път в менюто:{" "}
          <span className="whitespace-nowrap">Настройки → Фактури</span> (тази страница).
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <InvoicePreferencesForm />
      </CardContent>
    </Card>
  );
}
