"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  User, 
  Building, 
  ShieldCheck, 
  Users, 
  CreditCard,
  ChevronRight,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  iconName: string;
}

const navItems: NavItem[] = [
  {
    title: "Профил",
    href: "/settings/profile",
    iconName: "User"
  },
  {
    title: "Компания",
    href: "/settings/company",
    iconName: "Building"
  },
  {
    title: "Сигурност",
    href: "/settings/security",
    iconName: "ShieldCheck"
  },
  {
    title: "Членове на екипа",
    href: "/settings/team",
    iconName: "Users"
  },
  {
    title: "Абонамент",
    href: "/settings/subscription",
    iconName: "CreditCard"
  },
  {
    title: "Настройки на фактури",
    href: "/settings/invoice-preferences",
    iconName: "FileText"
  }
];

const iconMap = {
  User,
  Building,
  ShieldCheck,
  Users,
  CreditCard,
  FileText
};

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col">
      {navItems.map((item) => {
        const Icon = iconMap[item.iconName as keyof typeof iconMap];
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
              isActive && "bg-muted font-medium"
            )}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
              <span>{item.title}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        );
      })}
    </nav>
  );
}
