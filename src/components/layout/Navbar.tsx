"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User, ChevronDown, Plus, Sun, Moon, Command, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo } from "react";
import { useCommandPalette } from "@/components/ui/command-palette";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { APP_NAME } from "@/config/constants";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/subscription-plans";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { plan, isLoadingUsage, canCreateInvoice } = useSubscriptionLimit();
  const planDisplayName = plan && plan in SUBSCRIPTION_PLANS
    ? SUBSCRIPTION_PLANS[plan as SubscriptionPlanKey].displayName
    : plan ?? "Безплатен";

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => {
    if (!mounted) return false;
    if (theme === "system") {
      return resolvedTheme === "dark";
    }
    return theme === "dark";
  }, [theme, resolvedTheme, mounted]);

  // Skip rendering navbar on auth pages or home page when not authenticated
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  if (pathname === "/" && !isAuthenticated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full rounded-none border-x-0 border-t-0 border-b border-border glass-card" role="banner">
      <div className="flex items-center h-14 sm:h-16">
        {/* Logo - Left side */}
        <Link
          href="/dashboard"
          aria-label="Начална страница"
          className="flex h-full min-w-0 shrink-0 items-center justify-start gap-2 border-r border-border/50 pl-14 pr-2 sm:w-72 sm:justify-center sm:gap-3 sm:px-0"
        >
          <div className="hidden h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-lg sm:flex sm:h-10 sm:w-10 sm:rounded-xl">
            <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <span className="max-w-28 truncate text-sm font-bold tracking-tight sm:max-w-none sm:text-xl">
            {APP_NAME}
          </span>
          {!isLoadingUsage && (
            <span
              className="shrink-0 rounded-md border border-border/60 bg-muted/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:text-xs"
              title="Текущ план"
            >
              {planDisplayName}
            </span>
          )}
        </Link>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Right Section - Actions */}
        <div className="flex items-center gap-1 px-2 sm:gap-2 sm:px-4 md:px-6">
          {/* Command Palette Button */}
          <Button 
            variant="outline" 
            className="hidden md:flex h-10 px-3 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Отвори командна палитра (⌘K)"
          >
            <Command className="h-4 w-4" />
            <span className="text-sm">Търси...</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
              ⌘K
            </kbd>
          </Button>
          
          {/* Quick Add Invoice Icon - only when usage loaded and allowed */}
          {!isLoadingUsage && canCreateInvoice && (
            <Button 
              asChild 
              size="icon" 
              className="h-8 w-8 rounded-full gradient-primary text-white border-0 shadow-md hover:opacity-90 sm:h-10 sm:w-10"
              title="Нова фактура"
              aria-label="Нова фактура"
            >
              <Link href="/invoices/new">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </Link>
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                aria-label="Потребителско меню"
                className="flex h-9 items-center gap-1.5 rounded-md pl-1 pr-1.5 sm:h-10 sm:gap-2 sm:pl-2 sm:pr-3"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full gradient-primary text-xs font-semibold text-white sm:h-8 sm:w-8 sm:text-sm">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name?.split(' ')[0] || 'Потребител'}
                  </p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">
                  {session?.user?.name || 'Потребител'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              {/* Theme Toggle – single button: icon = current mode, click = switch */}
              <div
                className="px-3 py-2 flex items-center justify-between"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm">Тема</span>
                {mounted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 min-w-8"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    aria-label={isDark ? "Светла тема" : "Тъмна тема"}
                  >
                    {isDark ? (
                      <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="flex w-full items-center">
                  <User className="mr-2 h-4 w-4" />
                  Профил
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Настройки
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Изход
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
