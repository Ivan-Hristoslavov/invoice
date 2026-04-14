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
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 lg:flex-row lg:items-start lg:gap-8 xl:gap-10">
      <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-60 lg:self-start xl:w-64">
        {sidebar}
      </aside>
      <main className="min-w-0 flex-1">
        <div className="pb-2 sm:pb-4 lg:pb-6">
          {isPending ? <SettingsSkeleton /> : children}
        </div>
      </main>
    </div>
  );
}
