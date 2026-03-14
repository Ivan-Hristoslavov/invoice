"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, MailPlus, RefreshCcw, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UserRoleActions from "../users/user-role-actions";
import { UsageCounter, LockedButton } from "@/components/ui/pro-feature-lock";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";

type TeamRole = "OWNER" | "ADMIN" | "MANAGER" | "ACCOUNTANT" | "VIEWER";

interface AccessibleCompany {
  id: string;
  name: string;
  ownerUserId: string;
  role: TeamRole;
}

interface TeamInviteRecord {
  id: string;
  companyId: string;
  email: string;
  role: TeamRole;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  invitedByUserId: string;
  invitedUserId?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TeamMemberRecord {
  userId: string;
  role: TeamRole;
  companyId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  isOwner?: boolean;
}

const INVITABLE_ROLES: Exclude<TeamRole, "OWNER">[] = ["ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"];

function getRoleLabel(role: string) {
  switch (role) {
    case "ADMIN":
      return "Администратор";
    case "MANAGER":
      return "Мениджър";
    case "ACCOUNTANT":
      return "Счетоводител";
    case "VIEWER":
      return "Наблюдател";
    case "OWNER":
      return "Собственик";
    default:
      return role;
  }
}

interface TeamSettingsClientProps {
  companies: AccessibleCompany[];
  company: AccessibleCompany;
  members: TeamMemberRecord[];
  invites: TeamInviteRecord[];
  currentUserId: string;
  currentUserRole: string;
}

export default function TeamSettingsClient({
  companies,
  company,
  members,
  invites,
  currentUserId,
  currentUserRole,
}: TeamSettingsClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("MANAGER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const { canAddUser, getUserUsage, isLoadingUsage, isBusiness } = useSubscriptionLimit();

  const userUsage = getUserUsage();
  const canManageInvites = currentUserRole === "OWNER" || currentUserRole === "ADMIN";
  const inviteCount = invites.length;

  async function handleCreateInvite() {
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          email,
          role,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Неуспешно изпращане на поканата");

      if (payload.inviteUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.inviteUrl);
        toast.success("Поканата е създадена и линкът е копиран");
      } else {
        toast.success("Поканата е създадена");
      }

      setEmail("");
      setRole("MANAGER");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Неуспешно изпращане на поканата");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleInviteAction(inviteId: string, action: "copy" | "resend" | "revoke") {
    try {
      setPendingInviteId(inviteId);

      if (action === "copy") {
        const invite = invites.find((entry) => entry.id === inviteId);
        const inviteUrl =
          invite && typeof window !== "undefined"
            ? `${window.location.origin}/team/accept?token=${invite.token}`
            : null;
        if (!inviteUrl) throw new Error("Линкът за поканата липсва");
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Линкът за поканата е копиран");
        return;
      }

      const response = await fetch(`/api/team/invites/${inviteId}`, {
        method: action === "revoke" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: action === "resend" ? JSON.stringify({ action: "resend" }) : undefined,
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Неуспешна операция");

      if (action === "resend" && payload.inviteUrl && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload.inviteUrl);
        toast.success("Поканата е подновена и линкът е копиран");
      } else {
        toast.success(action === "revoke" ? "Поканата е оттеглена" : "Поканата е обновена");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Неуспешна операция");
    } finally {
      setPendingInviteId(null);
    }
  }

  return (
    <div className="app-page-shell">
      <div className="page-header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">Екип</h1>
            {!isLoadingUsage && <UsageCounter used={members.length} limit={userUsage.limit} label="члена" />}
          </div>
          <p className="card-description mt-1">
            Управлявайте достъпа до {company.name}, канете колеги и следете чакащите покани.
          </p>
        </div>
        {companies.length > 1 ? (
          <Select
            value={company.id}
            onValueChange={(nextCompanyId) => router.push(`/settings/team?companyId=${nextCompanyId}`)}
            aria-label="Избор на компания за екипа"
          >
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map((availableCompany) => (
                <SelectItem key={availableCompany.id} value={availableCompany.id}>
                  {availableCompany.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {!isBusiness && members.length >= userUsage.limit && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <ShieldCheck className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Достигнахте лимита за членове във вашия план. Надградете за да каните още хора.
            </span>
            <Button asChild size="sm">
              <Link href="/settings/subscription">Виж плановете</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Членове на екипа</CardTitle>
            <CardDescription>Собственикът, активните роли и достъпът им до компанията.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:hidden">
              {members.map((member) => (
                <div key={member.userId} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{member.user.name || member.user.email}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                    <UserRoleActions
                      userId={member.user.id}
                      currentRole={member.role}
                      companyId={company.id}
                      isCurrentUser={member.user.id === currentUserId}
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={member.role === "OWNER" ? "secondary" : "outline"}>
                      {getRoleLabel(member.role)}
                    </Badge>
                    {member.isOwner ? <Badge variant="secondary">Собственик</Badge> : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/85 shadow-sm">
                <table className="min-w-full border-collapse">
                  <thead className="bg-muted/35">
                    <tr>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Член
                      </th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Имейл
                      </th>
                      <th scope="col" className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Роля
                      </th>
                      <th scope="col" className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.userId} className="border-t border-border/50 transition-colors hover:bg-muted/40">
                        <th scope="row" className="px-5 py-3.5 text-left font-medium">
                          {member.user.name || member.user.email}
                        </th>
                        <td className="px-5 py-3.5 align-middle">{member.user.email}</td>
                        <td className="px-5 py-3.5 align-middle">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={member.role === "OWNER" ? "secondary" : "outline"}>
                              {getRoleLabel(member.role)}
                            </Badge>
                            {member.isOwner ? <Badge variant="secondary">Собственик</Badge> : null}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right align-middle">
                          <UserRoleActions
                            userId={member.user.id}
                            currentRole={member.role}
                            companyId={company.id}
                            isCurrentUser={member.user.id === currentUserId}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Покани нов член</CardTitle>
              <CardDescription>
                Изпратете покана по имейл и задайте началната роля в екипа.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                aria-label="Имейл за покана"
              />
              <Select value={role} onValueChange={setRole} aria-label="Роля за новия член">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((teamRole) => (
                    <SelectItem key={teamRole} value={teamRole}>
                      {getRoleLabel(teamRole)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {canManageInvites ? (
                canAddUser ? (
                  <Button onClick={handleCreateInvite} disabled={isSubmitting || !email.trim()} className="btn-responsive">
                    <MailPlus className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Изпращане..." : "Създай покана"}
                  </Button>
                ) : (
                  <LockedButton requiredPlan="BUSINESS">Създай покана</LockedButton>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Само собственикът или администратор може да кани нови членове.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Чакащи покани</CardTitle>
              <CardDescription>
                {inviteCount === 0 ? "Няма активни покани в момента." : `${inviteCount} активни покани очакват приемане.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">Когато изпратите покана, тя ще се появи тук.</p>
                </div>
              ) : (
                invites.map((invite) => (
                  <div key={invite.id} className="rounded-2xl border border-border/60 bg-background/40 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{invite.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Роля: {getRoleLabel(invite.role)} · Валидна до {new Date(invite.expiresAt).toLocaleDateString("bg-BG")}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInviteAction(invite.id, "copy")}
                        disabled={pendingInviteId === invite.id}
                        className="btn-responsive"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Копирай линк
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleInviteAction(invite.id, "resend")}
                        disabled={pendingInviteId === invite.id}
                        className="btn-responsive"
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Поднови
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleInviteAction(invite.id, "revoke")}
                        disabled={pendingInviteId === invite.id}
                        className="btn-responsive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Оттегли
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
