import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { APP_NAME } from "@/config/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { CompanySettingsTabs } from "./CompanySettingsTabs";

export const metadata: Metadata = {
  title: `Настройки на компанията | ${APP_NAME}`,
  description: "Актуализирайте информацията за вашата компания",
};

export default async function CompanySettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/signin");
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    redirect("/signin");
  }

  let company = null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("Company")
      .select("*")
      .eq("userId", sessionUser.id)
      .single();

    if (!error && data) {
      company = data;
    }
  } catch (error) {
    console.error("Грешка при връзка с базата данни:", error);
  }

  return <CompanySettingsTabs company={company} />;
}
