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
  CardTitle 
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
    <Card>
      <CardHeader>
        <CardTitle>Настройки на фактури</CardTitle>
        <CardDescription>
          Настройте предпочитанията си за фактури, включително ДДС ставка по подразбиране
        </CardDescription>
      </CardHeader>
      <CardContent>
        <InvoicePreferencesForm />
      </CardContent>
    </Card>
  );
} 