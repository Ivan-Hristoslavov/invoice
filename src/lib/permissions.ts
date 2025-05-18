import { getServerSession } from "next-auth";
import { Session } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
  // Get all user roles
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      OR: [
        { companyId: companyId },
        { companyId: null }, // Global roles
      ],
    },
    select: {
      role: true,
    },
  });

  const roles = userRoles.map((userRole) => userRole.role);

  // If no roles found, return empty array
  if (roles.length === 0) return [];

  // Get all permissions for these roles
  const rolePermissions = await prisma.rolePermission.findMany({
    where: {
      role: { in: roles },
    },
    include: {
      permission: true,
    },
  });

  // Return unique permission names
  return [...new Set(rolePermissions.map((rp) => rp.permission.name))];
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
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
    },
    select: {
      role: true,
      companyId: true,
    },
  });
  
  return userRoles;
}

// Check if a user has a specific role in a company
export async function hasRole(
  userId: string,
  role: Role,
  companyId?: string
): Promise<boolean> {
  const count = await prisma.userRole.count({
    where: {
      userId,
      role,
      ...(companyId ? { companyId } : { companyId: null }),
    },
  });
  
  return count > 0;
}

// Assign a role to a user
export async function assignRole(
  userId: string,
  role: Role,
  companyId?: string
): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_companyId: {
        userId,
        companyId: companyId || null,
      },
    },
    update: {
      role,
    },
    create: {
      userId,
      role,
      companyId,
    },
  });
  
  // Clear cache for this user
  clearUserPermissionCache(userId);
}

// Remove a role from a user
export async function removeRole(
  userId: string,
  companyId?: string
): Promise<void> {
  await prisma.userRole.deleteMany({
    where: {
      userId,
      ...(companyId ? { companyId } : { companyId: null }),
    },
  });
  
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