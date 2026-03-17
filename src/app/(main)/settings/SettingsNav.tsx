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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Настройки</h2>
            <p className="text-[10px] text-muted-foreground">Управление на акаунта</p>
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

      <Tabs value={selectedKey} onValueChange={handleTabChange} className="w-full">
        <TabsList
          className={cn(
            "w-full flex flex-row flex-nowrap gap-0 rounded-xl border border-border/60 bg-card p-1",
            "min-h-10 overflow-x-auto overflow-y-hidden",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
          aria-label="Настройки"
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
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                  "data-[selected=false]:text-slate-100 text-slate-100",
                  "disabled:opacity-70 disabled:pointer-events-none"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
