"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bell, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAuthenticated = status === "authenticated";
  
  // Skip rendering navbar on auth pages
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  // Only show create invoice button on relevant pages
  const showCreateButton = isAuthenticated && (
    pathname === "/dashboard" || 
    pathname === "/invoices" || 
    pathname.startsWith("/invoices/")
  );

  return (
    <header className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="hidden md:block w-64">
          {/* Placeholder for sidebar alignment */}
        </div>

        <div className="w-full md:w-auto flex items-center justify-end flex-1 gap-4">
          {showCreateButton && (
            <Button size="sm" asChild>
              <Link href="/invoices/new">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">
                      {session.user.name || session.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 