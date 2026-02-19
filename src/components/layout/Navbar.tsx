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
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useMemo } from "react";
import { useCommandPalette } from "@/components/ui/command-palette";
import { APP_NAME } from "@/config/constants";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();

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

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };
  
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
    <header className="sticky top-0 z-50 w-full glass-card !rounded-none !border-t-0 !border-l-0 !border-r-0" role="banner">
      <div className="flex items-center h-16">
        {/* Logo - Left side - Fixed width matching sidebar, starts from edge */}
        <Link href="/dashboard" aria-label="Начална страница" className="flex items-center justify-center gap-3 w-72 h-full shrink-0 border-r border-border/50">
          <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/25">
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
          
          {/* Quick Add Invoice Icon - Hidden on small mobile */}
          <Button 
            asChild 
            size="icon" 
            className="hidden sm:flex h-10 w-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            title="Нова фактура"
            aria-label="Нова фактура"
          >
            <Link href="/invoices/new">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Потребителско меню">
              <div className="h-10 pl-2 pr-3 gap-2 hover:bg-muted rounded-md flex items-center cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-none">
                    {session?.user?.name?.split(' ')[0] || 'Потребител'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </div>
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
              {/* Theme Toggle */}
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Тема</span>
                </div>
                <div className="flex items-center gap-2">
                  {mounted && (
                    <Switch 
                      checked={isDark}
                      onCheckedChange={handleThemeToggle}
                      aria-label="Превключи тъмна тема"
                    />
                  )}
                  <Moon className="h-4 w-4 text-muted-foreground" />
                </div>
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
