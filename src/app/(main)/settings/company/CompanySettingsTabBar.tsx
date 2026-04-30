"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanySettings } from "./CompanySettingsContext";

const TABS = [
  { href: "/settings/company" as const, label: "Основни", icon: Building2, match: (p: string) => p === "/settings/company" },
  { href: "/settings/company/bank" as const, label: "Банка", icon: CreditCard, match: (p: string) => p.startsWith("/settings/company/bank") },
  { href: "/settings/company/logo" as const, label: "Лого", icon: ImageIcon, match: (p: string) => p.startsWith("/settings/company/logo") },
] as const;

export function CompanySettingsTabBar() {
  const pathname = usePathname();
  const { isNew } = useCompanySettings();

  if (isNew) {
    return null;
  }

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Компания</p>
      <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <nav className="flex min-w-0 flex-1 gap-1 rounded-2xl border border-border/60 bg-card/80 p-1" aria-label="Секции компания">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors sm:min-h-10",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/80 hover:bg-muted/80"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      </div>
    </div>
  );
}
