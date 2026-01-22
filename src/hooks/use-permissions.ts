"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// Define Role type locally since we're not using Prisma on client side
type Role = 'ADMIN' | 'OWNER' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';

export function usePermission(permissionName: string, companyId?: string) {
  const { data: session, status } = useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkPermission = useCallback(async () => {
    if (!session?.user) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    try {
      const url = new URL("/api/auth/check-permission", window.location.origin);
      url.searchParams.append("permission", permissionName);
      if (companyId) url.searchParams.append("companyId", companyId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to check permission");
      }

      const data = await response.json();
      setHasPermission(data.hasAccess);
    } catch (err) {
      console.error("Error checking permission:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, [session, permissionName, companyId]);

  useEffect(() => {
    if (status === "loading") return;
    checkPermission();
  }, [status, checkPermission]);

  return {
    hasPermission,
    isLoading: isLoading || status === "loading",
    error,
    refresh: checkPermission,
  };
}

export function useRole(role: Role, companyId?: string) {
  const { data: session, status } = useSession();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkRole = useCallback(async () => {
    if (!session?.user) {
      setHasRole(false);
      setIsLoading(false);
      return;
    }

    try {
      const url = new URL("/api/auth/check-role", window.location.origin);
      url.searchParams.append("role", role);
      if (companyId) url.searchParams.append("companyId", companyId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error("Failed to check role");
      }

      const data = await response.json();
      setHasRole(data.hasAccess);
    } catch (err) {
      console.error("Error checking role:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasRole(false);
    } finally {
      setIsLoading(false);
    }
  }, [session, role, companyId]);

  useEffect(() => {
    if (status === "loading") return;
    checkRole();
  }, [status, checkRole]);

  return {
    hasRole,
    isLoading: isLoading || status === "loading",
    error,
    refresh: checkRole,
  };
} 