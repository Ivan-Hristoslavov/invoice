"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Building,
  ShieldCheck,
  CreditCard,
  FileText,
  Settings,
  ArrowLeft,
  UsersRound,
  Scale,
  ScrollText,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  id: string;
  title: string;
  items: readonly NavItem[];
};

const navGroups: readonly NavGroup[] = [
  {
    id: "org",
    title: "Организация и фактури",
    items: [
      { id: "company", title: "Компания", href: "/settings/company", icon: Building },
      { id: "invoice-preferences", title: "Фактури", href: "/settings/invoice-preferences", icon: FileText },
      { id: "tax-compliance", title: "Данъци (НАП)", href: "/settings/tax-compliance", icon: Scale },
    ],
  },
  {
    id: "account",
    title: "Акаунт",
    items: [
      { id: "profile", title: "Профил", href: "/settings/profile", icon: User },
      { id: "security", title: "Сигурност", href: "/settings/security", icon: ShieldCheck },
    ],
  },
  {
    id: "billing",
    title: "Плащане",
    items: [
      {
        id: "subscription",
        title: "Абонамент и плащания",
        href: "/settings/subscription",
        icon: CreditCard,
      },
    ],
  },
  {
    id: "system",
    title: "Система",
    items: [{ id: "audit-logs", title: "Одит", href: "/settings/audit-logs", icon: ScrollText }],
  },
] as const;

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const rest = pathname.slice(href.length);
  return rest.startsWith("/") && rest.length > 1;
}

function SettingsNavHeader({
  title,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button asChild variant="ghost" size="sm" className="h-8 shrink-0 rounded-full px-3 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap">
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад
        </Link>
      </Button>
    </div>
  );
}

export function SettingsNav() {
  const pathname = usePathname();
  const isTeamPage = pathname === "/settings/team" || pathname.startsWith("/settings/team/");

  if (isTeamPage) {
    return (
      <div className="w-full space-y-4">
        <SettingsNavHeader
          title="Екип"
          description="Покани, роли и достъп — от основното меню „Екип“"
          icon={UsersRound}
          iconClassName="bg-violet-500/15 text-violet-600 dark:text-violet-300"
        />
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 dark:bg-muted/10">
          <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
            Настройките на приложението са отделно от екипа.
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl">
            <Link href="/settings/company" className="inline-flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Към настройки
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 lg:space-y-5">
      <SettingsNavHeader
        title="Настройки"
        description="Компания, фактури, акаунт, абонамент и одит"
        icon={Settings}
      />

      <div className="space-y-4" aria-label="Раздели в настройките">
        {navGroups.map((group) => (
          <div key={group.id}>
            <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <nav className="flex flex-col gap-1" aria-label={group.title}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground/85 hover:bg-muted/80 hover:text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="min-w-0 leading-snug">{item.title}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  );
}
