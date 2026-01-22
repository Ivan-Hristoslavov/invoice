import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import UsersClient from "./UsersClient";

export const metadata = {
  title: "Управление на потребители - Invoicy",
  description: "Управлявайте потребителите и ролите им във вашата организация",
};

type Role = "ADMIN" | "OWNER" | "MANAGER" | "ACCOUNTANT" | "VIEWER";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/signin");
  }
  
  // Check if user has permission to manage users
  const canManageUsers = await checkPermission("user:manage");
  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Достъпът е отказан</h1>
        <p className="text-muted-foreground mb-6">
          Нямате права да управлявате потребители. Моля, свържете се с администратора.
        </p>
        <Button asChild>
          <Link href="/dashboard">Към таблото</Link>
        </Button>
      </div>
    );
  }
  
  const supabase = createAdminClient();
  
  // Get all companies the user belongs to
  const { data: companies } = await supabase
    .from("Company")
    .select("id, name")
    .eq("userId", session.user.id);
  
  if (!companies || companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center">
        <h1 className="text-2xl font-bold mb-2">Няма намерени компании</h1>
        <p className="text-muted-foreground mb-6">
          Трябва да създадете компания, преди да можете да управлявате потребители.
        </p>
        <Button asChild>
          <Link href="/settings/company">Създай компания</Link>
        </Button>
      </div>
    );
  }
  
  // For simplicity, we'll manage users for the first company
  const company = companies[0];
  
  // Get all users with their roles for this company
  const { data: userRoles } = await supabase
    .from("UserRole")
    .select("id, role, userId")
    .eq("companyId", company.id);
  
  // Get user details for each role
  const userIds = (userRoles || []).map(ur => ur.userId);
  const { data: users } = await supabase
    .from("User")
    .select("id, name, email, image")
    .in("id", userIds.length > 0 ? userIds : ['']);
  
  const usersMap = new Map((users || []).map(u => [u.id, u]));
  
  const usersWithRoles = (userRoles || []).map(userRole => ({
    ...userRole,
    role: userRole.role as Role,
    user: usersMap.get(userRole.userId) || { id: userRole.userId, name: null, email: '', image: null }
  }));
  
  return (
    <UsersClient 
      company={company}
      usersWithRoles={usersWithRoles}
      currentUserId={session.user.id}
    />
  );
}
