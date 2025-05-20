import Link from "next/link";
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
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

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }

  const navItems = [
    {
      title: "Профил",
      href: "/settings/profile",
      icon: User,
      description: "Управление на личната информация"
    },
    {
      title: "Компания",
      href: "/settings/company",
      icon: Building,
      description: "Обновяване на детайлите за компанията"
    },
    {
      title: "Сигурност",
      href: "/settings/security",
      icon: ShieldCheck,
      description: "Парола и сигурност на акаунта"
    },
    {
      title: "Членове на екипа",
      href: "/settings/team",
      icon: Users,
      description: "Покана и управление на членове на екипа"
    },
    {
      title: "Фактуриране",
      href: "/settings/billing",
      icon: CreditCard,
      description: "Управление на вашия абонамент и фактуриране"
    },
    {
      title: "Настройки на фактури",
      href: "/settings/invoice-preferences",
      icon: FileText,
      description: "Настройки за фактури и ДДС"
    }
  ];
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground">Управление на вашия акаунт и предпочитания</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Настройки</CardTitle>
            <CardDescription>Управление на вашия акаунт</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <nav className="flex flex-col">
              {navItems.map((item) => (
                <SettingsNavItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                />
              ))}
            </nav>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}

interface SettingsNavItemProps {
  href: string;
  icon: React.ElementType;
  title: string;
}

function SettingsNavItem({ href, icon: Icon, title }: SettingsNavItemProps) {
  // In a client component, we would use usePathname() to get the current path
  // For now, we'll use a simple string includes check
  const isActive = typeof window !== 'undefined' && window.location.pathname.includes(href);
  
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
        isActive && "bg-muted font-medium"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <span>{title}</span>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
} 