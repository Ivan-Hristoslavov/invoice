"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BackgroundShapes } from "@/components/ui/background-shapes";

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

  // If on home page and not authenticated
  if (pathname === "/" && !isAuthenticated) {
    return (
      <main className="min-h-screen relative">
        <BackgroundShapes variant="vibrant" />
        {children}
      </main>
    );
  }

  // Standard layout with navigation - simplified for faster transitions
  return (
    <div className="flex min-h-screen relative">
      <BackgroundShapes variant="subtle" />
      <Sidebar />
      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150 pb-6 sm:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
