"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { CommandPaletteProvider } from "@/components/ui/command-palette";
import { KeyboardShortcutsProvider } from "@/components/ui/keyboard-shortcuts-provider";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  const isAuthPage = pathname.includes("/signin") || pathname.includes("/signup");

  // Skip rendering layout on auth pages
  if (isAuthPage) {
    return (
      <main className="min-h-screen">{children}</main>
    );
  }

  // If on home page and not authenticated - landing page has its own background
  if (pathname === "/" && !isAuthenticated) {
    return (
      <main className="min-h-screen relative">
        {children}
      </main>
    );
  }

  if (pathname === "/" && status === "loading") {
    return <main className="min-h-screen relative" />;
  }

  // Standard layout with navigation - fixed sidebar on desktop
  return (
    <KeyboardShortcutsProvider>
      <CommandPaletteProvider>
        <div className="relative flex min-h-screen flex-col overflow-x-hidden pt-14 sm:pt-16">
          <a href="#main-content" className="skip-to-content">
            Преминете към съдържанието
          </a>
          <BackgroundShapes variant="subtle" />
          {/* Navbar at top - full width */}
          <Navbar />
          {/* Content area with sidebar */}
          <div className="flex flex-1 lg:pl-72">
            <Sidebar />
            <main
              id="main-content"
              tabIndex={-1}
              className="min-w-0 flex-1 animate-in overflow-x-hidden p-3 pt-4 fade-in duration-150 focus:outline-none sm:p-4 lg:p-5 xl:p-6"
            >
              <div className="mx-auto w-full max-w-7xl pb-5 sm:pb-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </KeyboardShortcutsProvider>
  );
}
