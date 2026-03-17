"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip, Table } from "@heroui/react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Lock, Crown } from "lucide-react";
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

function getRoleChipColor(role: Role): "danger" | "default" | "warning" | "success" {
  switch (role) {
    case "ADMIN":
      return "danger";
    case "OWNER":
      return "default";
    case "MANAGER":
      return "warning";
    case "ACCOUNTANT":
      return "success";
    case "VIEWER":
      return "default";
    default:
      return "default";
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
    <div className="space-y-4 sm:space-y-6">
      {/* Subscription Warning for FREE/PRO plan */}
      {!isBusiness && totalUsers >= userUsage.limit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Този план позволява 1 потребител. С Бизнес до 5 члена в екипа — каняйте съдружници и счетоводители.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="bg-linear-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 sm:ml-4">
                <Crown className="h-4 w-4 mr-2" />
                Вижте плановете →
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold sm:text-3xl">Управление на потребители</h1>
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
        {isLoadingUsage ? (
          <Button disabled className="w-full sm:w-auto">
            Проверяваме плана...
          </Button>
        ) : canAddUser ? (
          <Button asChild className="w-full sm:w-auto">
            <Link href="/settings/users/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Покани потребител
            </Link>
          </Button>
        ) : isBusiness ? (
          <Button disabled className="w-full sm:w-auto">
            Достигнат е лимитът за екипа
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
          <div className="space-y-3 md:hidden">
            {usersWithRoles.map((userRole) => (
              <div key={userRole.id} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{userRole.user.name || "Потребител без име"}</p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{userRole.user.email}</p>
                  </div>
                  <UserRoleActions
                    userId={userRole.user.id}
                    currentRole={userRole.role}
                    companyId={company.id}
                    isCurrentUser={userRole.user.id === currentUserId}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip
                    color={getRoleChipColor(userRole.role)}
                    variant="soft"
                    size="sm"
                  >
                    {getRoleLabel(userRole.role)}
                  </Chip>
                  <span className="text-xs text-muted-foreground">
                    {getRoleDescription(userRole.role)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
          <Table variant="secondary" className="rounded-2xl border border-border/50 bg-transparent">
            <Table.ScrollContainer>
              <Table.Content aria-label="Потребители на компанията">
                <Table.Header className="bg-muted/35">
                  <Table.Column isRowHeader className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Потребител
                  </Table.Column>
                  <Table.Column className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Имейл
                  </Table.Column>
                  <Table.Column className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Роля
                  </Table.Column>
                  <Table.Column className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Права
                  </Table.Column>
                  <Table.Column className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Действия
                  </Table.Column>
                </Table.Header>
                <Table.Body items={usersWithRoles}>
                  {(userRole) => (
                    <Table.Row key={userRole.id} id={userRole.id}>
                      <Table.Cell className="px-4 py-3">
                        <div className="font-medium">
                          {userRole.user.name || "Потребител без име"}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        {userRole.user.email}
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <Chip
                          color={getRoleChipColor(userRole.role)}
                          variant="soft"
                          size="sm"
                        >
                          {getRoleLabel(userRole.role)}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {getRoleDescription(userRole.role)}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="px-4 py-3 text-right">
                        <UserRoleActions
                          userId={userRole.user.id}
                          currentRole={userRole.role}
                          companyId={company.id}
                          isCurrentUser={userRole.user.id === currentUserId}
                        />
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
