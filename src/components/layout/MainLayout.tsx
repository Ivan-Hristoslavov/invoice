"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { BackgroundShapes } from "@/components/ui/background-shapes";
import { CommandPaletteProvider } from "@/components/ui/command-palette";
import { KeyboardShortcutsProvider } from "@/components/ui/keyboard-shortcuts-provider";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { status } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname.includes("/signin") || pathname.includes("/signup");

  // Skip rendering layout on auth pages
  if (isAuthPage) {
    return (
      <main className="min-h-screen">{children}</main>
    );
  }

  // Landing: full-width content without app chrome while logged out or session is resolving
  if (pathname === "/" && (status === "unauthenticated" || status === "loading")) {
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
        <SidebarProvider>
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
              className="min-w-0 flex-1 animate-in overflow-x-hidden px-3 pb-6 pt-4 fade-in duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:pb-8 sm:pt-5 lg:px-5 lg:pb-10 lg:pt-6 xl:px-6"
            >
              <div className="mx-auto w-full max-w-[1440px] pb-2 sm:pb-3">
                {children}
              </div>
            </main>
          </div>
        </div>
        </SidebarProvider>
      </CommandPaletteProvider>
    </KeyboardShortcutsProvider>
  );
}
