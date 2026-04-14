"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  FileText,
  Users,
  UsersRound,
  Building,
  Package,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
} from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ThemeMenu } from "@/components/theme/ThemeMenu";

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
    name: "Протокол чл.117",
    href: "/vat-protocols-117",
    icon: ClipboardList,
    gradient: "from-teal-500 to-cyan-600",
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
  { 
    name: "Екип", 
    href: "/settings/team", 
    icon: UsersRound,
    gradient: "from-violet-500 to-purple-600"
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
  const { isOpen, setOpen, isMobile } = useSidebar();
  const { data: session, status } = useSession();
  const isSessionLoading = status === "loading";

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMobile, isOpen]);

  // Close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile, setOpen]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobile, isOpen, setOpen]);

  // Skip rendering sidebar on auth pages or home page when not authenticated
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  if (pathname === "/" && (status === "unauthenticated" || isSessionLoading)) {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  const isActive = (href: string) => {
    if (href === "/settings") {
      return (pathname === "/settings" || pathname.startsWith("/settings/")) && pathname !== "/settings/team";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <>
      {/* Backdrop - мобилно меню се отваря от бутона в Navbar */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/55 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed and always visible on desktop (lg+), collapsible on mobile only */}
      <motion.aside
        id="main-sidebar"
        className={cn(
          "fixed top-14 z-40 flex h-[calc(100dvh-3.5rem)] w-72 shrink-0 flex-col overflow-hidden border-t-0 border-b-0 glass-card sm:top-16 sm:h-[calc(100dvh-4rem)]",
          // Desktop: pinned to left, right border
          "lg:left-0 lg:right-auto lg:border-l-0 lg:border-r lg:border-border lg:translate-x-0",
          // Mobile: pinned to right, left border
          "right-0 border-r-0 border-l border-border lg:border-l-0",
          isMobile && !isOpen && "translate-x-full"
        )}
        initial={false}
        animate={{ x: isMobile && !isOpen ? "100%" : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Main nav: comfortable gap; scroll only on very short viewports */}
        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-2.5 pt-2 pb-2"
          role="navigation"
          aria-label="Основна навигация"
        >
          <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                  "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                  active 
                    ? `bg-linear-to-br ${item.gradient} shadow-md`
                    : "bg-muted group-hover:bg-muted"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4",
                    active ? "text-white" : "text-foreground/70"
                  )} aria-hidden="true" />
                </div>
                <span className="min-w-0 flex-1 leading-snug">{item.name}</span>
                {active && (
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="shrink-0 space-y-1 border-t px-2.5 py-2.5">
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <ThemeMenu layout="sidebarRow" align="start" className="mt-0.5" />
        </div>

        {/* User Section */}
        <div className="shrink-0 border-t px-2.5 py-2.5">
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-2.5 py-2">
            {isSessionLoading ? (
              <>
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-28 rounded-md" aria-hidden />
                  <Skeleton className="h-3 w-36 rounded-md" aria-hidden />
                </div>
                <Skeleton className="h-8 w-8 shrink-0 rounded-md" aria-hidden />
              </>
            ) : (
              <>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {session?.user?.name || "Потребител"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground leading-tight">
                    {session?.user?.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  title="Изход"
                  aria-label="Изход"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
