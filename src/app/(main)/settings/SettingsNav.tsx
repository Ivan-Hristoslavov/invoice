"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Building, 
  ShieldCheck, 
  Users, 
  CreditCard,
  FileText,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

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
      {
        title: "Екип",
        href: "/settings/team",
        iconName: "Users",
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
  Users,
  CreditCard,
  FileText
};

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Настройки</h2>
          <p className="text-[10px] text-muted-foreground">Управление на акаунта</p>
        </div>
      </div>

      {/* Mobile horizontal navigation */}
      <div className="lg:hidden overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-1.5 min-w-max">
          {navSections.flatMap((section) => section.items).map((item) => {
            const Icon = iconMap[item.iconName as keyof typeof iconMap];
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
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
      <div className="hidden lg:block space-y-5">
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
                        "h-4 w-4 flex-shrink-0",
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
