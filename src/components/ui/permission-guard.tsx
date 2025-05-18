"use client";

import { ReactNode } from "react";
import { Role } from "@prisma/client";
import { usePermission, useRole } from "@/hooks/use-permissions";

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

interface OrGuardProps extends BaseGuardProps {
  conditions: Array<{ permission?: string; role?: Role; companyId?: string }>;
}

export function OrGuard({
  conditions,
  children,
  fallback = null,
}: OrGuardProps) {
  const results = conditions.map((condition) => {
    if (condition.permission) {
      return usePermission(condition.permission, condition.companyId);
    } else if (condition.role) {
      return useRole(condition.role, condition.companyId);
    }
    return { hasPermission: false, hasRole: false, isLoading: false };
  });
  
  const isLoading = results.some(
    (result) => "isLoading" in result && result.isLoading
  );
  
  if (isLoading) {
    return null;
  }
  
  const hasAccess = results.some(
    (result) =>
      ("hasPermission" in result && result.hasPermission) ||
      ("hasRole" in result && result.hasRole)
  );
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
} 