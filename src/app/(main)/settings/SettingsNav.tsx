"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Building,
  ShieldCheck,
  CreditCard,
  FileText,
  Settings,
  ArrowLeft,
  Palette,
  UsersRound,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettingsNav } from "./SettingsNavProvider";

const navItems = [
  { id: "profile", title: "Профил", href: "/settings/profile", icon: User },
  { id: "appearance", title: "Външен вид", href: "/settings/appearance", icon: Palette },
  { id: "security", title: "Сигурност", href: "/settings/security", icon: ShieldCheck },
  { id: "company", title: "Компания", href: "/settings/company", icon: Building },
  { id: "invoice-preferences", title: "Фактури", href: "/settings/invoice-preferences", icon: FileText },
  { id: "subscription", title: "Абонамент", href: "/settings/subscription", icon: CreditCard },
];

function pathnameToTabId(pathname: string): string {
  if (!pathname.startsWith("/settings/")) return "profile";
  const segment = pathname.replace("/settings/", "").split("/")[0] || "";
  const found = navItems.find((item) => item.href === `/settings/${segment}` || item.id === segment);
  return found?.id ?? "profile";
}

export function SettingsNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPending, startTransition } = useSettingsNav();
  const selectedKey = pathnameToTabId(pathname);
  const isTeamPage =
    pathname === "/settings/team" || pathname.startsWith("/settings/team/");

  const handleTabChange = (key: string) => {
    const item = navItems.find((i) => i.id === key);
    if (item && item.href !== pathname) {
      startTransition(() => router.push(item.href));
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              isTeamPage
                ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                : "bg-primary/10 text-primary"
            )}
          >
            {isTeamPage ? (
              <UsersRound className="h-4 w-4" aria-hidden />
            ) : (
              <Settings className="h-4 w-4" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">
              {isTeamPage ? "Екип" : "Настройки"}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {isTeamPage ? "Покани, роли и достъп до компанията" : "Профил, сигурност и предпочитания"}
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 rounded-full px-3 lg:hidden w-auto min-w-[96px]"
        >
          <Link href="/dashboard" className="flex items-center gap-1.5 whitespace-nowrap">
            <ArrowLeft className="h-3.5 w-3.5" />
            Назад
          </Link>
        </Button>
      </div>

      {/* Екип ↔ акаунт настройки — същият контекст като в страничното меню */}
      <div
        className="flex w-full rounded-2xl border border-border/60 bg-muted/25 p-1 dark:bg-muted/15"
        role="tablist"
        aria-label="Екип или настройки на акаунта"
      >
        <Link
          href="/settings/team"
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors",
            isTeamPage
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
          aria-current={isTeamPage ? "page" : undefined}
        >
          <UsersRound className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span className="whitespace-nowrap">Екип</span>
        </Link>
        <Link
          href="/settings/profile"
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-sm font-semibold transition-colors",
            !isTeamPage
              ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          )}
          aria-current={!isTeamPage ? "page" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          <span className="whitespace-nowrap">Настройки</span>
        </Link>
      </div>

      {!isTeamPage ? (
        <Tabs value={selectedKey} onValueChange={handleTabChange} className="w-full">
          <TabsList
            className={cn(
              "w-full min-w-0 flex flex-row flex-nowrap gap-0 rounded-xl border border-border/50 bg-card/90 p-1 px-0.5 sm:px-1",
              "min-h-10 overflow-x-auto overflow-y-hidden",
              "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            )}
            aria-label="Раздели в настройките"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.id}
                  id={item.id}
                  value={item.id}
                  isDisabled={isPending}
                  className={cn(
                    "shrink-0 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
                    "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                    "data-[selected=false]:text-foreground/65 dark:data-[selected=false]:text-foreground/55",
                    "data-[selected=true]:[&_span]:text-primary-foreground data-[selected=false]:[&_span]:text-inherit",
                    "disabled:pointer-events-none disabled:opacity-70"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.title}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      ) : null}
    </div>
  );
}
