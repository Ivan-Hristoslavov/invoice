"use client";

import Link from "next/link";
import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserCog, UserPlus, ShieldAlert, Lock, Crown } from "lucide-react";
import UserRoleActions from "./user-role-actions";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter, LockedButton } from "@/components/ui/pro-feature-lock";

type Role = "ADMIN" | "OWNER" | "MANAGER" | "ACCOUNTANT" | "VIEWER";

interface UserWithRole {
  id: string;
  role: Role;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface UsersClientProps {
  company: { id: string; name: string };
  usersWithRoles: UserWithRole[];
  currentUserId: string;
}

function getRoleBadgeColor(role: Role) {
  switch (role) {
    case "ADMIN":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    case "OWNER":
      return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800";
    case "MANAGER":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "ACCOUNTANT":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "VIEWER":
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700";
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

export default function UsersClient({ company, usersWithRoles, currentUserId }: UsersClientProps) {
  // Subscription limit hook
  const { 
    plan, 
    isFree, 
    isPro,
    isBusiness,
    getUserUsage, 
    canAddUser,
    isLoadingUsage 
  } = useSubscriptionLimit();
  
  const userUsage = getUserUsage();
  const totalUsers = usersWithRoles.length;

  return (
    <div>
      {/* Subscription Warning for FREE/PRO plan */}
      {!isBusiness && totalUsers >= userUsage.limit && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              {isFree 
                ? "Вашият FREE план позволява само 1 потребител."
                : "Вашият PRO план позволява само 1 потребител."
              }
              {" "}Надградете до BUSINESS за до 5 потребители.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете до BUSINESS
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Управление на потребители</h1>
            {!isLoadingUsage && (
              <UsageCounter 
                used={totalUsers} 
                limit={userUsage.limit}
                label=""
              />
            )}
          </div>
          <p className="text-muted-foreground">
            Управлявайте потребителите и ролите им за {company.name}
          </p>
        </div>
        {canAddUser ? (
          <Button asChild>
            <Link href="/settings/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Покани потребител
            </Link>
          </Button>
        ) : (
          <LockedButton requiredPlan="BUSINESS">
            Покани потребител
          </LockedButton>
        )}
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
                      className={getRoleBadgeColor(userRole.role)}
                    >
                      {getRoleLabel(userRole.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getRoleDescription(userRole.role)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <UserRoleActions
                      userId={userRole.user.id}
                      currentRole={userRole.role}
                      companyId={company.id}
                      isCurrentUser={userRole.user.id === currentUserId}
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
