"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building,
  ShieldCheck,
  CreditCard,
  FileText,
  Settings,
  ArrowLeft,
  Palette,
  UsersRound,
  Scale,
  ScrollText,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Раздели в настройките — без „Екип“ (той е отделно в страничната навигация). */
const navItems = [
  { id: "company", title: "Компания", href: "/settings/company", icon: Building },
  { id: "invoice-preferences", title: "Фактури", href: "/settings/invoice-preferences", icon: FileText },
  { id: "tax-compliance", title: "Данъци (НАП)", href: "/settings/tax-compliance", icon: Scale },
  { id: "appearance", title: "Външен вид", href: "/settings/appearance", icon: Palette },
  { id: "security", title: "Сигурност", href: "/settings/security", icon: ShieldCheck },
  { id: "profile", title: "Профил", href: "/settings/profile", icon: User },
  { id: "billing", title: "Плащания", href: "/settings/billing", icon: Wallet },
  { id: "subscription", title: "Абонамент", href: "/settings/subscription", icon: CreditCard },
  { id: "audit-logs", title: "Одит", href: "/settings/audit-logs", icon: ScrollText },
] as const;

function isNavActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const rest = pathname.slice(href.length);
  return rest.startsWith("/") && rest.length > 1;
}

export function SettingsNav() {
  const pathname = usePathname();
  const isTeamPage = pathname === "/settings/team" || pathname.startsWith("/settings/team/");

  if (isTeamPage) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-300">
              <UsersRound className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight">Екип</h2>
              <p className="text-[10px] text-muted-foreground">Покани, роли и достъп — от основното меню „Екип“</p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 rounded-full px-3 lg:hidden"
          >
            <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap">
              <ArrowLeft className="h-3.5 w-3.5" />
              Назад
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-3 py-2.5 dark:bg-muted/10">
          <p className="w-full text-xs text-muted-foreground sm:w-auto sm:flex-1">
            Настройките на приложението са отделно от екипа.
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0 rounded-xl">
            <Link href="/settings/invoice-preferences" className="inline-flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Към настройки
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">Настройки</h2>
            <p className="text-[10px] text-muted-foreground">
              Компания, фактури, профил, плащания, абонамент и одит
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 lg:hidden"
        >
          <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap">
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </Link>
        </Button>
      </div>

      <nav
        className="flex w-full min-w-0 flex-nowrap gap-1 overflow-x-auto overflow-y-hidden rounded-xl border border-border/50 bg-card/90 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Раздели в настройките"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-muted/70 hover:text-foreground dark:text-foreground/60"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
