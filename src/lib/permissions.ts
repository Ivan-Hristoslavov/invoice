import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type UserSession = Session & {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

// Cache permission checks to reduce database queries
const permissionCache = new Map<string, boolean>();
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Get all permissions for a user
export async function getUserPermissions(userId: string, companyId?: string): Promise<string[]> {
  const supabase = createAdminClient();
  
  // Get all user roles
  let query = supabase
    .from("UserRole")
    .select("role")
    .eq("userId", userId);
  
  if (companyId) {
    query = query.or(`companyId.eq.${companyId},companyId.is.null`);
  } else {
    query = query.is("companyId", null);
  }
  
  const { data: userRoles, error: rolesError } = await query;
  
  if (rolesError || !userRoles || userRoles.length === 0) {
    return [];
  }

  const roles = userRoles.map((ur: any) => ur.role);

  // Get all permissions for these roles
  const { data: rolePermissions, error: permissionsError } = await supabase
    .from("RolePermission")
    .select("permissionId")
    .in("role", roles);

  if (permissionsError || !rolePermissions || rolePermissions.length === 0) {
    return [];
  }

  // Get unique permission IDs
  const permissionIds = [...new Set(rolePermissions.map((rp: any) => rp.permissionId))];

  // Get permission names
  const { data: permissions, error: permError } = await supabase
    .from("Permission")
    .select("name")
    .in("id", permissionIds);

  if (permError || !permissions) {
    return [];
  }

  // Return unique permission names
  return [...new Set(permissions.map((p: any) => p.name))];
}

// Check if a user has a specific permission
export async function hasPermission(
  userId: string,
  permissionName: string,
  companyId?: string
): Promise<boolean> {
  const cacheKey = `${userId}-${permissionName}-${companyId || "global"}`;
  
  // Check cache first
  if (permissionCache.has(cacheKey)) {
    return permissionCache.get(cacheKey) as boolean;
  }
  
  const userPermissions = await getUserPermissions(userId, companyId);
  const hasPermission = userPermissions.includes(permissionName);
  
  // Cache the result
  permissionCache.set(cacheKey, hasPermission);
  
  // Set cache expiry
  setTimeout(() => {
    permissionCache.delete(cacheKey);
  }, CACHE_EXPIRY);
  
  return hasPermission;
}

// Get all roles for a user across all companies
export async function getUserRoles(userId: string): Promise<{ role: Role, companyId: string | null }[]> {
  const supabase = createAdminClient();
  
  const { data: userRoles, error } = await supabase
    .from("UserRole")
    .select("role, companyId")
    .eq("userId", userId);
  
  if (error || !userRoles) {
    return [];
  }
  
  return userRoles.map((ur: any) => ({
    role: ur.role as Role,
    companyId: ur.companyId
  }));
}

// Check if a user has a specific role in a company
export async function hasRole(
  userId: string,
  role: Role,
  companyId?: string
): Promise<boolean> {
  const supabase = createAdminClient();
  
  let query = supabase
    .from("UserRole")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId)
    .eq("role", role);
  
  if (companyId) {
    query = query.eq("companyId", companyId);
  } else {
    query = query.is("companyId", null);
  }
  
  const { count, error } = await query;
  
  return !error && (count || 0) > 0;
}

// Assign a role to a user
export async function assignRole(
  userId: string,
  role: Role,
  companyId?: string
): Promise<void> {
  const supabase = createAdminClient();
  
  // Check if role already exists
  let query = supabase
    .from("UserRole")
    .select("id")
    .eq("userId", userId);
  
  if (companyId) {
    query = query.eq("companyId", companyId);
  } else {
    query = query.is("companyId", null);
  }
  
  const { data: existing, error: checkError } = await query.single();
  
  if (existing) {
    // Update existing role
    await supabase
      .from("UserRole")
      .update({ role, updatedAt: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    // Create new role
    const cuid = require("cuid");
    await supabase
      .from("UserRole")
      .insert({
        id: cuid(),
        userId,
        role,
        companyId: companyId || null,
        updatedAt: new Date().toISOString(),
      });
  }
  
  // Clear cache for this user
  clearUserPermissionCache(userId);
}

// Remove a role from a user
export async function removeRole(
  userId: string,
  companyId?: string
): Promise<void> {
  const supabase = createAdminClient();
  
  let query = supabase
    .from("UserRole")
    .delete()
    .eq("userId", userId);
  
  if (companyId) {
    query = query.eq("companyId", companyId);
  } else {
    query = query.is("companyId", null);
  }
  
  await query;
  
  // Clear cache for this user
  clearUserPermissionCache(userId);
}

// Check permission from session (server component)
export async function checkPermission(
  permissionName: string,
  companyId?: string
): Promise<boolean> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return false;
  }
  
  return hasPermission(session.user.id, permissionName, companyId);
}

// Clear all permission cache entries for a user
function clearUserPermissionCache(userId: string): void {
  for (const cacheKey of permissionCache.keys()) {
    if (cacheKey.startsWith(`${userId}-`)) {
      permissionCache.delete(cacheKey);
    }
  }
} 