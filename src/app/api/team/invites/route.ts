import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import {
  canManageCompanyTeam,
  createTeamInviteExpiryDate,
  createTeamInviteToken,
  getCompanyRoleForUser,
  getTeamMembersForCompany,
  normalizeTeamInviteEmail,
  TEAM_ROLES,
} from "@/lib/team";
import { supabaseAdmin } from "@/lib/supabase";
import { checkSubscriptionLimits } from "@/middleware/subscription";

const CreateInviteSchema = z.object({
  companyId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(TEAM_ROLES.filter((role) => role !== "OWNER") as ["ADMIN", "MANAGER", "ACCOUNTANT", "VIEWER"]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const payload = CreateInviteSchema.parse(await request.json());
    const normalizedEmail = normalizeTeamInviteEmail(payload.email);

    const { data: company } = await supabaseAdmin
      .from("Company")
      .select("id, name, userId")
      .eq("id", payload.companyId)
      .maybeSingle();

    if (!company) {
      return NextResponse.json({ error: "Компанията не е намерена" }, { status: 404 });
    }

    const currentUserRole = await getCompanyRoleForUser(sessionUser.id, payload.companyId);
    if (!canManageCompanyTeam(currentUserRole)) {
      return NextResponse.json({ error: "Нямате права да каните членове в екипа" }, { status: 403 });
    }

    const subscriptionCheck = await checkSubscriptionLimits(company.userId, "users");
    if (!subscriptionCheck.allowed) {
      return NextResponse.json({ error: subscriptionCheck.message || "Достигнат е лимитът за членове" }, { status: 403 });
    }

    const members = await getTeamMembersForCompany(payload.companyId);
    if (members.some((member) => normalizeTeamInviteEmail(member.user.email) === normalizedEmail)) {
      return NextResponse.json({ error: "Този потребител вече има достъп до компанията" }, { status: 409 });
    }

    const nowIso = new Date().toISOString();
    const expiresAt = createTeamInviteExpiryDate();
    const token = createTeamInviteToken();

    const { data: existingInvite } = await supabaseAdmin
      .from("TeamInvite")
      .select("id")
      .eq("companyId", payload.companyId)
      .eq("email", normalizedEmail)
      .eq("status", "PENDING")
      .gte("expiresAt", nowIso)
      .maybeSingle();

    const invitedUserLookup = await supabaseAdmin
      .from("User")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();

    const invitePayload = {
      companyId: payload.companyId,
      email: normalizedEmail,
      role: payload.role,
      token,
      status: "PENDING",
      invitedByUserId: sessionUser.id,
      invitedUserId: invitedUserLookup.data?.id ?? null,
      expiresAt,
      updatedAt: nowIso,
    };

    const { data: invite, error } = existingInvite
      ? await supabaseAdmin
          .from("TeamInvite")
          .update(invitePayload)
          .eq("id", existingInvite.id)
          .select("*")
          .single()
      : await supabaseAdmin
          .from("TeamInvite")
          .insert({
            id: crypto.randomUUID(),
            ...invitePayload,
          })
          .select("*")
          .single();

    if (error || !invite) {
      throw error || new Error("Неуспешно създаване на покана");
    }

    const inviteUrl = `${request.nextUrl.origin}/team/accept?token=${invite.token}`;

    return NextResponse.json({
      invite,
      inviteUrl,
      message: "Поканата е създадена успешно",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Невалидни данни за поканата" }, { status: 400 });
    }

    console.error("Error creating team invite:", error);
    return NextResponse.json({ error: "Неуспешно създаване на поканата" }, { status: 500 });
  }
}
