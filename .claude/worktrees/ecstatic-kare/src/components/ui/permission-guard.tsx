"use client";

import { ReactNode } from "react";
import { usePermission, useRole } from "@/hooks/use-permissions";

// Define Role type locally since we're not using Prisma on client side
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';

interface BaseGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PermissionGuardProps extends BaseGuardProps {
  permission: string;
  companyId?: string;
}

interface RoleGuardProps extends BaseGuardProps {
  role: Role;
  companyId?: string;
}

export function PermissionGuard({
  permission,
  companyId,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermission(permission, companyId);
  
  if (isLoading) {
    return null; // Or return a loading indicator if needed
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

export function RoleGuard({
  role,
  companyId,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole, isLoading } = useRole(role, companyId);
  
  if (isLoading) {
    return null; // Or return a loading indicator if needed
  }
  
  return hasRole ? <>{children}</> : <>{fallback}</>;
}
