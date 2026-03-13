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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] overflow-hidden">
      {/* Fixed width sidebar navigation - non-scrolling */}
      <aside className="w-full lg:w-72 flex-shrink-0 lg:overflow-y-auto">
        <SettingsNav />
      </aside>
      
      {/* Main content area - scrollable */}
      <main className="flex-1 min-w-0 overflow-y-auto pr-2">
        <div className="pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
