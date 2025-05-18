"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building,
  Package,
  CreditCard,
  Settings,
  Menu,
  X,
  FileCheck,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { useSession } from "next-auth/react";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Skip rendering sidebar completely on auth pages
  if (pathname.includes("/signin") || pathname.includes("/signup")) {
    return null;
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Navigation items only shown to authenticated users
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "Invoices", href: "/invoices", icon: <FileText className="w-5 h-5" /> },
    { name: "Clients", href: "/clients", icon: <Users className="w-5 h-5" /> },
    { name: "Companies", href: "/companies", icon: <Building className="w-5 h-5" /> },
    { name: "Products", href: "/products", icon: <Package className="w-5 h-5" /> },
    { name: "Payments", href: "/payments", icon: <CreditCard className="w-5 h-5" /> },
    { name: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
    { name: "Tax Compliance", href: "/settings/tax-compliance", icon: <FileCheck className="w-5 h-5" /> },
    { name: "Subscription", href: "/settings/subscription", icon: <CreditCardIcon className="w-5 h-5" /> },
  ];
  
  // Public navigation items shown to everyone
  const publicNavItems = [
    { name: "Features", href: "/#features", icon: <Package className="w-5 h-5" /> },
    { name: "Pricing", href: "/#pricing", icon: <CreditCardIcon className="w-5 h-5" /> },
  ];

  // If we're on the home page but not authenticated, don't show the sidebar at all
  if (pathname === "/" && !isAuthenticated) {
    return null;
  }

  // Determine which navigation items to show based on authentication status
  const displayNavItems = isAuthenticated ? navItems : publicNavItems;

  return (
    <>
      {/* Mobile toggle - only show if there are nav items to display */}
      {displayNavItems.length > 0 && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 bg-background border-r transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
              <span className="text-xl font-bold">{APP_NAME}</span>
            </Link>
          </div>

          {displayNavItems.length > 0 && (
            <nav className="flex-grow px-4 pb-4">
              <ul className="space-y-1">
                {displayNavItems.map((item) => (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      className={`
                        flex items-center px-3 py-2 rounded-md text-sm font-medium 
                        ${pathname === item.href 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              <p>{APP_NAME} v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
} 