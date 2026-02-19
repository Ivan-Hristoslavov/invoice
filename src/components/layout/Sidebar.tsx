"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Package,
  Settings,
  Menu,
  X,
  HelpCircle,
  LogOut,
  ChevronRight,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { 
    name: "Табло", 
    href: "/dashboard", 
    icon: LayoutDashboard,
    gradient: "from-blue-500 to-indigo-600"
  },
  { 
    name: "Фактури", 
    href: "/invoices", 
    icon: FileText,
    gradient: "from-emerald-500 to-teal-600"
  },
  { 
    name: "Кредитни", 
    href: "/credit-notes", 
    icon: ArrowDownCircle,
    gradient: "from-red-500 to-rose-600"
  },
  { 
    name: "Дебитни", 
    href: "/debit-notes", 
    icon: ArrowUpCircle,
    gradient: "from-emerald-500 to-teal-600"
  },
  { 
    name: "Клиенти", 
    href: "/clients", 
    icon: Users,
    gradient: "from-amber-500 to-orange-600"
  },
  { 
    name: "Компании", 
    href: "/companies", 
    icon: Building,
    gradient: "from-slate-500 to-slate-600"
  },
  { 
    name: "Продукти", 
    href: "/products", 
    icon: Package,
    gradient: "from-cyan-500 to-blue-600"
  },
];

const bottomNavItems = [
  { 
    name: "Настройки", 
    href: "/settings", 
    icon: Settings,
  },
  { 
    name: "Помощ", 
    href: "/help", 
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop (>= 1024px), sidebar is always visible, no collapse
      if (!mobile) {
        setIsOpen(false);
      }
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  // Skip rendering sidebar on auth pages or home page when not authenticated
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  if (pathname === "/" && !isAuthenticated) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible when sidebar is hidden (mobile) */}
      {isMobile && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-3 left-4 z-[60] h-10 w-10 bg-background/95 backdrop-blur-md border border-border shadow-lg hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Затвори менюто" : "Отвори менюто"}
        >
          {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
        </Button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed and always visible on desktop (lg+), collapsible on mobile only */}
      <motion.aside 
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 flex flex-col glass-card !rounded-none !border-r !border-l-0 !border-t-0 !border-b-0 shrink-0",
          "lg:translate-x-0",
          isMobile && !isOpen && "-translate-x-full"
        )}
        initial={false}
        animate={{ x: isMobile && !isOpen ? "-100%" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Main Navigation */}
        <nav className="flex-1 px-4 pt-2 pb-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Основна навигация">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Меню
          </p>
          {mainNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                  active 
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg`
                    : "bg-muted group-hover:bg-muted"
                )}>
                  <item.icon className={cn(
                    "h-5 w-5",
                    active ? "text-white" : "text-muted-foreground"
                  )} aria-hidden="true" />
                </div>
                <span>{item.name}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 ml-auto" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 border-t space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
            Настройки
          </p>
          {bottomNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link 
                key={item.name}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Section */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold text-sm">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session?.user?.name || 'Потребител'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Изход"
              aria-label="Изход"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {/* Version */}
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {APP_NAME} v1.0.0
          </div>
        </div>
      </motion.aside>
    </>
  );
}
