import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { APP_NAME } from "@/config/constants";
import { resolveSessionUser } from "@/lib/session-user";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: `${APP_NAME} — фактури, Протокол 117 и VIES`,
  description:
    "Фактури и известия за България: протокол по чл. 117 ЗДДС, VIES проверка за EU VAT, PDF и проследяване на документи. Без плащания през приложението.",
  openGraph: {
    title: `${APP_NAME} — фактури, Протокол 117 и VIES`,
    description:
      "Протокол чл. 117, VIES и фактури на едно място — за български фирми и контрагенти от ЕС.",
  },
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const sessionUser = await resolveSessionUser(session.user);
    if (sessionUser) {
      redirect("/dashboard");
    }
  }

  return <HomePageClient />;
}
