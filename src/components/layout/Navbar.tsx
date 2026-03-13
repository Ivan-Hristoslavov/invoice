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

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { isLoadingUsage, canCreateInvoice } = useSubscriptionLimit();

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
    <header className="sticky top-0 z-50 w-full glass-card rounded-none! border-t-0! border-x-0! border-b border-border" role="banner">
      <div className="flex items-center h-16">
        {/* Logo - Left side - Fixed width matching sidebar, starts from edge */}
        <Link href="/dashboard" aria-label="Начална страница" className="flex items-center justify-center gap-3 w-72 h-full shrink-0 border-r border-border/50">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
        </Link>
        {/* Spacer */}
        <div className="flex-1" />
        {/* Right Section - Actions */}
        <div className="flex items-center gap-2 px-4 md:px-6">
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
              className="hidden sm:flex h-10 w-10 gradient-primary hover:opacity-90 text-white border-0 shadow-md"
              title="Нова фактура"
              aria-label="Нова фактура"
            >
              <Link href="/invoices/new">
                <Plus className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                aria-label="Потребителско меню"
                className="h-10 pl-2 pr-3 gap-2 rounded-md flex items-center"
              >
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name?.split(' ')[0] || 'Потребител'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
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
              <DropdownMenuItem>
                <Link href="/settings/profile" className="cursor-pointer flex items-center w-full">
                  <User className="mr-2 h-4 w-4" />
                  Профил
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="cursor-pointer flex items-center w-full">
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
