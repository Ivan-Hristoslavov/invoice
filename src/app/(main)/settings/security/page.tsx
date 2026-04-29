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
import { PasswordForm } from "./PasswordForm";
import { PageHeader } from "@/components/page";
import { Section } from "@/components/page/Section";

export const metadata: Metadata = {
  title: `Сигурност | ${APP_NAME}`,
  description: "Парола и бъдещи настройки за сигурност",
};

export default async function SecuritySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Сигурност"
        description="Управление на паролата и достъпа до акаунта"
      />

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Парола</CardTitle>
          <CardDescription>Сменете паролата си с потвърждение на текущата</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Section density="compact" className="border-dashed border-amber-500/30 bg-amber-500/5">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Двуфакторна автентикация и сесии</span> —{" "}
          <span className="text-amber-800 dark:text-amber-200">предстои</span>. Ще може да преглеждате активни
          устройства и да изключвате отдалечен достъп.
        </p>
      </Section>
    </div>
  );
}
