import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

export const TEAM_ROLES = ["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const TEAM_INVITE_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export type TeamInviteStatus = (typeof TEAM_INVITE_STATUSES)[number];

export interface AccessibleCompany {
  id: string;
  name: string;
  ownerUserId: string;
  role: TeamRole;
}

export interface TeamMemberRecord {
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

export interface TeamInviteRecord {
  id: string;
  companyId: string;
  email: string;
  role: TeamRole;
  token: string;
  status: TeamInviteStatus;
  invitedByUserId: string;
  invitedUserId?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function normalizeTeamInviteEmail(email: string) {
  return email.trim().toLowerCase();
}

export function canManageCompanyTeam(role?: TeamRole | null) {
  return role === "OWNER" || role === "ADMIN";
}

export function createTeamInviteToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function createTeamInviteExpiryDate(days = 7) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

export async function getAccessibleCompaniesForUser(userId: string): Promise<AccessibleCompany[]> {
  const [ownedCompaniesResult, membershipsResult] = await Promise.all([
    supabaseAdmin
      .from("Company")
      .select("id, name, userId")
      .eq("userId", userId)
      .order("createdAt", { ascending: true }),
    supabaseAdmin
      .from("UserRole")
      .select("companyId, role")
      .eq("userId", userId)
      .not("companyId", "is", null),
  ]);

  const ownedCompanies = (ownedCompaniesResult.data || []).map((company) => ({
    id: company.id,
    name: company.name,
    ownerUserId: company.userId,
    role: "OWNER" as TeamRole,
  }));

  const membershipCompanyIds = [...new Set((membershipsResult.data || []).map((item) => item.companyId).filter(Boolean))];

  const membershipCompaniesResult =
    membershipCompanyIds.length > 0
      ? await supabaseAdmin
          .from("Company")
          .select("id, name, userId")
          .in("id", membershipCompanyIds)
      : { data: [], error: null };

  const membershipRoleByCompanyId = new Map(
    (membershipsResult.data || []).map((membership) => [membership.companyId, membership.role as TeamRole])
  );

  const membershipCompanies = (membershipCompaniesResult.data || [])
    .filter((company) => company.id && company.userId)
    .map((company) => ({
      id: company.id,
      name: company.name,
      ownerUserId: company.userId,
      role: membershipRoleByCompanyId.get(company.id) || "VIEWER",
    }))
    .filter((company) => company.ownerUserId !== userId);

  const deduped = new Map<string, AccessibleCompany>();
  for (const company of [...ownedCompanies, ...membershipCompanies]) {
    if (!deduped.has(company.id)) deduped.set(company.id, company);
  }

  return [...deduped.values()];
}

export async function getSelectedCompanyForUser(userId: string, requestedCompanyId?: string | null) {
  const companies = await getAccessibleCompaniesForUser(userId);
  const selectedCompany =
    companies.find((company) => company.id === requestedCompanyId) ||
    companies[0] ||
    null;

  return {
    companies,
    selectedCompany,
  };
}

export async function getAccessibleOwnerUserIdsForUser(userId: string) {
  const companies = await getAccessibleCompaniesForUser(userId);
  const ownerUserIds = new Set<string>([userId]);

  for (const company of companies) {
    ownerUserIds.add(company.ownerUserId);
  }

  return [...ownerUserIds];
}

export async function getCompanyRoleForUser(userId: string, companyId: string): Promise<TeamRole | null> {
  const { data: company } = await supabaseAdmin
    .from("Company")
    .select("id, userId")
    .eq("id", companyId)
    .maybeSingle();

  if (!company) return null;
  if (company.userId === userId) return "OWNER";

  const { data: membership } = await supabaseAdmin
    .from("UserRole")
    .select("role")
    .eq("userId", userId)
    .eq("companyId", companyId)
    .maybeSingle();

  return (membership?.role as TeamRole | undefined) ?? null;
}

export async function getTeamMembersForCompany(companyId: string): Promise<TeamMemberRecord[]> {
  const { data: company } = await supabaseAdmin
    .from("Company")
    .select("id, userId, user:User(id, name, email, image)")
    .eq("id", companyId)
    .maybeSingle();

  const { data: memberships } = await supabaseAdmin
    .from("UserRole")
    .select("userId, role, companyId, user:User(id, name, email, image)")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: true });

  const members = new Map<string, TeamMemberRecord>();

  const ownerUser = Array.isArray(company?.user) ? company?.user[0] : company?.user;
  if (company?.userId && ownerUser?.email) {
    members.set(company.userId, {
      companyId,
      userId: company.userId,
      role: "OWNER",
      user: {
        id: ownerUser.id,
        name: ownerUser.name ?? null,
        email: ownerUser.email,
        image: ownerUser.image ?? null,
      },
      isOwner: true,
    });
  }

  for (const membership of memberships || []) {
    const membershipUser = Array.isArray(membership.user) ? membership.user[0] : membership.user;
    if (!membership.userId || !membershipUser?.email) continue;

    members.set(membership.userId, {
      companyId,
      userId: membership.userId,
      role: (membership.role as TeamRole) || "VIEWER",
      user: {
        id: membershipUser.id,
        name: membershipUser.name ?? null,
        email: membershipUser.email,
        image: membershipUser.image ?? null,
      },
      isOwner: membership.userId === company?.userId,
    });
  }

  return [...members.values()];
}

export async function getPendingTeamInvitesForCompany(companyId: string): Promise<TeamInviteRecord[]> {
  const nowIso = new Date().toISOString();

  const { data: expiredInvites } = await supabaseAdmin
    .from("TeamInvite")
    .select("id")
    .eq("companyId", companyId)
    .eq("status", "PENDING")
    .lt("expiresAt", nowIso);

  if (expiredInvites && expiredInvites.length > 0) {
    await supabaseAdmin
      .from("TeamInvite")
      .update({ status: "EXPIRED", updatedAt: nowIso })
      .in("id", expiredInvites.map((invite) => invite.id));
  }

  const { data: invites } = await supabaseAdmin
    .from("TeamInvite")
    .select("*")
    .eq("companyId", companyId)
    .eq("status", "PENDING")
    .gte("expiresAt", nowIso)
    .order("createdAt", { ascending: false });

  return (invites || []) as TeamInviteRecord[];
}
