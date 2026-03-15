"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Building, 
  ShieldCheck, 
  CreditCard,
  FileText,
  Settings,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navSections = [
  {
    title: "Акаунт",
    items: [
      {
        title: "Профил",
        href: "/settings/profile",
        iconName: "User",
      },
      {
        title: "Сигурност",
        href: "/settings/security",
        iconName: "ShieldCheck",
      },
    ],
  },
  {
    title: "Бизнес",
    items: [
      {
        title: "Компания",
        href: "/settings/company",
        iconName: "Building",
      },
      {
        title: "Фактури",
        href: "/settings/invoice-preferences",
        iconName: "FileText",
      },
    ],
  },
  {
    title: "Плащане",
    items: [
      {
        title: "Абонамент",
        href: "/settings/subscription",
        iconName: "CreditCard",
      },
    ],
  },
];

const iconMap = {
  User,
  Building,
  ShieldCheck,
  CreditCard,
  FileText
};

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col rounded-2xl border border-border/60 bg-card p-3 shadow-sm lg:sticky lg:top-20 lg:p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1 py-1">
        <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Настройки</h2>
          <p className="text-[10px] text-muted-foreground">Управление на акаунта</p>
        </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-3 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap">
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </Link>
        </Button>
      </div>

      {/* Mobile horizontal navigation */}
      <div className="overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2 pr-3">
          {navSections.flatMap((section) => section.items).map((item) => {
            const Icon = iconMap[item.iconName as keyof typeof iconMap];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors snap-start",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                <span className="whitespace-nowrap">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop vertical navigation - compact fixed width */}
      <div className="hidden space-y-5 lg:block">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = iconMap[item.iconName as keyof typeof iconMap];
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 relative",
                      isActive
                        ? "bg-primary/10 text-primary font-medium pl-4 border-l-2 border-primary rounded-l-none"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {Icon && (
                      <Icon className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                    )}
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
