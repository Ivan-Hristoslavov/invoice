import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCog, UserPlus, ShieldAlert } from "lucide-react";
import UserRoleActions from "./user-role-actions";

export const metadata = {
  title: "Управление на потребители - FacturaPro",
  description: "Управлявайте потребителите и ролите им във вашата организация",
};

type Role = "ADMIN" | "OWNER" | "MANAGER" | "ACCOUNTANT" | "VIEWER";

function getRoleBadgeColor(role: Role) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 border-red-200";
    case "OWNER":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "MANAGER":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ACCOUNTANT":
      return "bg-green-100 text-green-800 border-green-200";
    case "VIEWER":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getRoleDescription(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Пълен достъп до системата";
    case "OWNER":
      return "Пълен достъп до компанията";
    case "MANAGER":
      return "Създава и управлява повечето ресурси";
    case "ACCOUNTANT":
      return "Управлява финансови записи";
    case "VIEWER":
      return "Само за четене";
    default:
      return "";
  }
}

function getRoleLabel(role: Role) {
  switch (role) {
    case "ADMIN":
      return "Администратор";
    case "OWNER":
      return "Собственик";
    case "MANAGER":
      return "Мениджър";
    case "ACCOUNTANT":
      return "Счетоводител";
    case "VIEWER":
      return "Наблюдател";
    default:
      return role;
  }
}

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
    user: usersMap.get(userRole.userId) || { id: userRole.userId, name: null, email: '', image: null }
  }));
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Управление на потребители</h1>
          <p className="text-muted-foreground">
            Управлявайте потребителите и ролите им за {company.name}
          </p>
        </div>
        <Button asChild>
          <Link href="/settings/users/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Покани потребител
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Потребители на компанията</CardTitle>
          <CardDescription>
            Всички потребители с достъп до {company.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Потребител</TableHead>
                <TableHead>Имейл</TableHead>
                <TableHead>Роля</TableHead>
                <TableHead>Права</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersWithRoles.map((userRole) => (
                <TableRow key={userRole.id}>
                  <TableCell>
                    <div className="font-medium">
                      {userRole.user.name || "Потребител без име"}
                    </div>
                  </TableCell>
                  <TableCell>{userRole.user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getRoleBadgeColor(userRole.role as Role)}
                    >
                      {getRoleLabel(userRole.role as Role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getRoleDescription(userRole.role as Role)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRoleActions
                      userId={userRole.user.id}
                      currentRole={userRole.role as Role}
                      companyId={company.id}
                      isCurrentUser={userRole.user.id === session.user.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
