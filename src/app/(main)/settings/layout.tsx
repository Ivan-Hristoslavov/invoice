import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsNav } from "./SettingsNav";
import { SettingsLayoutClient } from "./SettingsLayoutClient";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/signin");
  }

  return (
    <SettingsLayoutClient sidebar={<SettingsNav />}>
      {children}
    </SettingsLayoutClient>
  );
}
