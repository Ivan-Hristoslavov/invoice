"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function SettingsLayoutClient({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  const pathname = usePathname();
  const isTeamPage = pathname === "/settings/team";

  if (isTeamPage) {
    return (
      <div className="min-w-0">
        <div className="pb-2 sm:pb-4 lg:pb-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      <header className="w-full shrink-0">{sidebar}</header>
      <main className="min-w-0">
        <div className="pb-2 sm:pb-4 lg:pb-6">{children}</div>
      </main>
    </div>
  );
}
