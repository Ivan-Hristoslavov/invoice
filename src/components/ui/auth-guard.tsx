"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: Role;
  fallback?: React.ReactNode;
}

export default function AuthGuard({
  children,
  requiredPermission,
  requiredRole,
  fallback
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Not authenticated
    if (status === "unauthenticated") {
      router.push(`/signin?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // Still loading session
    if (status === "loading") {
      return;
    }
    
    // Check permissions if needed
    if (requiredPermission || requiredRole) {
      const checkAccess = async () => {
        try {
          let response;
          
          if (requiredPermission) {
            response = await fetch(`/api/auth/check-permission?permission=${requiredPermission}`);
          } else if (requiredRole) {
            response = await fetch(`/api/auth/check-role?role=${requiredRole}`);
          }
          
          if (response && response.ok) {
            const data = await response.json();
            setHasAccess(data.hasAccess);
          } else {
            setHasAccess(false);
          }
        } catch (error) {
          console.error("Error checking access:", error);
          setHasAccess(false);
        }
      };
      
      checkAccess();
    } else {
      // No special permissions needed, just authentication
      setHasAccess(true);
    }
  }, [status, requiredPermission, requiredRole, router, pathname]);
  
  // Loading state
  if (status === "loading" || hasAccess === null) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse space-y-2 text-center">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto"></div>
          <div className="h-4 w-32 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Access denied
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Card className="mx-auto max-w-md my-8">
        <CardHeader className="text-center">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-2" />
          <CardTitle className="text-xl">Достъпът е отказан</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p>Нямате права за достъп до тази страница.</p>
          </div>
          <Button onClick={() => router.push("/dashboard")}>
            Връщане към таблото
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Access granted
  return <>{children}</>;
} 