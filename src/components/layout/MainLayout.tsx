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

  // Standard layout with navigation - fixed sidebar on desktop
  return (
    <KeyboardShortcutsProvider>
      <CommandPaletteProvider>
        <div className="h-screen overflow-hidden relative">
          <a href="#main-content" className="skip-to-content">
            Преминете към съдържанието
          </a>
          <BackgroundShapes variant="subtle" />
          {/* Navbar at top - full width */}
          <Navbar />
          {/* Content area with sidebar */}
          <div className="flex h-[calc(100vh-4rem)]">
            <Sidebar />
            <main className="flex-1 lg:ml-72 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150 overflow-y-auto overflow-x-hidden">
              <div id="main-content" className="max-w-7xl mx-auto w-full pb-6 sm:pb-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </CommandPaletteProvider>
    </KeyboardShortcutsProvider>
  );
}
