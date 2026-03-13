import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsNav } from "./SettingsNav";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }
  
  return (
    <div className="flex min-h-full flex-col gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
      <aside className="w-full shrink-0 lg:sticky lg:top-0 lg:self-start">
        <SettingsNav />
      </aside>
      
      <main className="min-w-0">
        <div className="pb-2 sm:pb-4 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
