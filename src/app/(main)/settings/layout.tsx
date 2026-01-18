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
import { SettingsNav } from "./SettingsNav";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/signin");
  }
  
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
            <SettingsNav />
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
