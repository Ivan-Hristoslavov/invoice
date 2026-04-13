"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@heroui/react";
import { Plus, Command, FileText, Menu, X } from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import { useCommandPalette } from "@/components/ui/command-palette";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/config/constants";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from "@/lib/subscription-plans";
import { cn } from "@/lib/utils";

function userDisplayInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name?.trim() || email?.trim() || "?").replace(/\s+/g, " ");
  if (!name?.trim() && email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  const parts = source.split(" ").filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase() || "?";
  return source.slice(0, 2).toUpperCase() || "?";
}

export function Navbar() {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const { isOpen, setOpen, isMobile } = useSidebar();
  const isAuthenticated = status === "authenticated";
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { plan, isLoadingUsage, canCreateInvoice } = useSubscriptionLimit();
  const planDisplayName = plan && plan in SUBSCRIPTION_PLANS
    ? SUBSCRIPTION_PLANS[plan as SubscriptionPlanKey].displayName
    : plan ?? "Безплатен";

  const planBadgeClass =
    plan === "STARTER"
      ? "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400"
      : plan === "PRO"
        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : plan === "BUSINESS"
          ? "border-violet-500/50 bg-violet-500/10 text-violet-600 dark:text-violet-400"
          : "border-border/60 bg-muted/80 text-muted-foreground";

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
        {/* Logo - икона + име + бадж; на мобилни по-малко padding */}
        <Link
          href="/dashboard"
          aria-label="Начална страница"
          className={cn(
            "flex h-full min-w-0 shrink items-center justify-start gap-1.5 border-r border-border/50 pl-3 pr-2 sm:w-72 sm:justify-center sm:gap-3 sm:shrink-0 sm:pl-0 sm:pr-0 lg:px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-lg sm:h-10 sm:w-10 sm:rounded-xl">
            <FileText className="h-4 w-4 text-white sm:h-5 sm:w-5" />
          </div>
          <span className="min-w-0 truncate text-sm font-bold tracking-tight sm:max-w-none sm:text-xl">
            {APP_NAME}
          </span>
          {isLoadingUsage ? (
            <Skeleton className="h-5 w-14 shrink-0 rounded-md sm:w-16" aria-hidden />
          ) : (
            <span
              className={cn(
                "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-medium sm:text-xs",
                planBadgeClass
              )}
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
          {/* Command Palette Button – скрит на мобилни; от md нагоре показваме ⌘K */}
          <Button 
            variant="outline" 
            className="hidden h-10 items-center gap-2 rounded-2xl px-3 text-muted-foreground hover:text-foreground md:flex"
            onClick={() => setCommandPaletteOpen(true)}
            aria-label="Търси"
          >
            <Command className="h-4 w-4" />
            <span className="text-sm">Търси...</span>
            <kbd className="pointer-events-none hidden select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:inline-flex">
              ⌘K
            </kbd>
          </Button>
          
          {/* Quick Add Invoice – фиксиран кръгъл бутон 40×40, без разтягане */}
          {!isLoadingUsage && canCreateInvoice && (
            <Link
              href="/invoices/new"
              title="Нова фактура"
              aria-label="Нова фактура"
              className="flex h-10 w-10 min-h-10 min-w-10 max-h-10 max-w-10 shrink-0 items-center justify-center rounded-full gradient-primary text-white shadow-md transition-shadow hover:shadow-lg hover:ring-2 hover:ring-emerald-400/25 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}

          {session?.user && (
            <Link
              href="/settings/profile"
              className="hidden shrink-0 sm:flex"
              aria-label={
                session.user.name
                  ? `Профил: ${session.user.name}`
                  : session.user.email
                    ? `Профил: ${session.user.email}`
                    : "Профил"
              }
            >
              <Avatar
                size="sm"
                className="h-9 w-9 border border-border/60 bg-muted text-xs font-semibold"
              >
                <Avatar.Image src={session.user.image ?? undefined} alt="" />
                <Avatar.Fallback className="bg-muted text-foreground">
                  {userDisplayInitials(session.user.name, session.user.email)}
                </Avatar.Fallback>
              </Avatar>
            </Link>
          )}

          {/* Mobile: навигация отдясно – същият размер и закръгленост */}
          {isMobile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full p-0 border border-border/60 bg-background/80 hover:bg-muted"
              onClick={() => setOpen((prev) => !prev)}
              aria-label={isOpen ? "Затвори менюто" : "Отвори менюто"}
              aria-controls="main-sidebar"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
