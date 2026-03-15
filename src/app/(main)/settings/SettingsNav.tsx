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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "profile", title: "Профил", href: "/settings/profile", icon: User },
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
  const selectedKey = pathnameToTabId(pathname);

  const handleTabChange = (key: string) => {
    const item = navItems.find((i) => i.id === key);
    if (item) router.push(item.href);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Настройки</h2>
            <p className="text-[10px] text-muted-foreground">Управление на акаунта</p>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 w-full rounded-full px-3 sm:w-auto lg:hidden">
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
            const isActive = selectedKey === item.id;
            return (
              <TabsTrigger
                key={item.id}
                id={item.id}
                value={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                  "data-[selected=false]:text-muted-foreground hover:text-foreground"
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
