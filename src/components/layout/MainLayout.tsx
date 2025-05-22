"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageTransition } from "@/components/animation/PageTransition";
import { AnimatePresence } from "framer-motion";

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
      <AnimatePresence mode="wait">
        <PageTransition key={pathname}>
          <main className="min-h-screen">{children}</main>
        </PageTransition>
      </AnimatePresence>
    );
  }

  // Ако сме на началната страница и потребителят не е автентикиран
  if (pathname === "/" && !isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <PageTransition key={pathname}>
          <main className="min-h-screen">{children}</main>
        </PageTransition>
      </AnimatePresence>
    );
  }

  // За всички останали случаи, показваме layout-а с навигацията
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 md:ml-64">
        <Navbar />
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>
            <main className="p-4 md:p-6">{children}</main>
          </PageTransition>
        </AnimatePresence>
      </div>
    </div>
  );
} 