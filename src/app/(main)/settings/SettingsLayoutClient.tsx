"use client";

import { ReactNode } from "react";
import { useSettingsNav } from "./SettingsNavProvider";
import { SettingsSkeleton } from "@/components/ui/skeletons";

export function SettingsLayoutClient({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: ReactNode;
}) {
  const { isPending } = useSettingsNav();

  return (
    <div className="flex min-h-full flex-col gap-4">
      <header className="w-full shrink-0">{sidebar}</header>
      <main className="min-w-0">
        <div className="pb-2 sm:pb-4 lg:pb-6">
          {isPending ? <SettingsSkeleton /> : children}
        </div>
      </main>
    </div>
  );
}
