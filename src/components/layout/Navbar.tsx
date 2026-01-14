"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bell, Search, Settings, LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  
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

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Табло";
    if (pathname === "/invoices") return "Фактури";
    if (pathname.startsWith("/invoices/new")) return "Нова фактура";
    if (pathname.startsWith("/invoices/")) return "Детайли за фактура";
    if (pathname === "/clients") return "Клиенти";
    if (pathname.startsWith("/clients/new")) return "Нов клиент";
    if (pathname.startsWith("/clients/")) return "Детайли за клиент";
    if (pathname === "/companies") return "Компании";
    if (pathname.startsWith("/companies/new")) return "Нова компания";
    if (pathname === "/products") return "Продукти";
    if (pathname.startsWith("/products/new")) return "Нов продукт";
    if (pathname === "/settings") return "Настройки";
    if (pathname.startsWith("/settings/")) return "Настройки";
    return "";
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 lg:px-8">
        {/* Left Section - Page Title & Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Mobile menu spacer */}
          <div className="w-10 lg:hidden" />
          
          {/* Search (hidden on mobile) */}
          <div className="hidden md:flex relative w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Търсене..." 
              className="pl-9 h-10 border-border"
            />
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 pl-2 pr-3 gap-2 hover:bg-muted">
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-semibold">
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
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Профил
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
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
