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
} from "@/lib/team";
import { supabaseAdmin } from "@/lib/supabase";
import { createMagicLinkToken } from "@/lib/magic-link";
import { sendTeamInviteEmail } from "@/lib/email";

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
    default:
      return role;
  }
}

const UpdateInviteSchema = z.object({
  action: z.enum(["resend"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const { id } = await context.params;
    UpdateInviteSchema.parse(await request.json());

    const { data: invite } = await supabaseAdmin
      .from("TeamInvite")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: "Поканата не е намерена" }, { status: 404 });
    }

    const currentUserRole = await getCompanyRoleForUser(sessionUser.id, invite.companyId);
    if (!canManageCompanyTeam(currentUserRole)) {
      return NextResponse.json({ error: "Нямате права за тази покана" }, { status: 403 });
    }

    const updatedAt = new Date().toISOString();
    const { data: updatedInvite, error } = await supabaseAdmin
      .from("TeamInvite")
      .update({
        token: createTeamInviteToken(),
        status: "PENDING",
        expiresAt: createTeamInviteExpiryDate(),
        updatedAt,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !updatedInvite) {
      throw error || new Error("Неуспешно обновяване на поканата");
    }

    const { data: company } = await supabaseAdmin
      .from("Company")
      .select("name")
      .eq("id", updatedInvite.companyId)
      .maybeSingle();

    const magicLogin = await createMagicLinkToken(updatedInvite.email);
    const inviteUrl = `${request.nextUrl.origin}/team/accept?token=${updatedInvite.token}`;
    const magicLinkUrl =
      `${request.nextUrl.origin}/signin?email=${encodeURIComponent(updatedInvite.email)}` +
      `&magicToken=${encodeURIComponent(magicLogin.token)}` +
      `&callbackUrl=${encodeURIComponent(`/team/accept?token=${updatedInvite.token}`)}`;

    let emailSent = false;
    let emailError: string | null = null;

    try {
      await sendTeamInviteEmail({
        to: updatedInvite.email,
        companyName: company?.name || "вашата компания",
        inviterName: sessionUser.name || sessionUser.email || "Екипът",
        roleLabel: getRoleLabel(updatedInvite.role),
        acceptUrl: inviteUrl,
        magicLinkUrl,
      });
      emailSent = true;
    } catch (emailSendError) {
      emailError =
        emailSendError instanceof Error
          ? emailSendError.message
          : "Неуспешно изпращане на поканата по имейл";
      console.error("Error resending team invite email:", emailSendError);
    }

    return NextResponse.json({
      invite: updatedInvite,
      inviteUrl,
      magicLinkUrl,
      emailSent,
      emailError,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Невалидна заявка" }, { status: 400 });
    }

    console.error("Error updating invite:", error);
    return NextResponse.json({ error: "Неуспешно обновяване на поканата" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const { id } = await context.params;

    const { data: invite } = await supabaseAdmin
      .from("TeamInvite")
      .select("companyId")
      .eq("id", id)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: "Поканата не е намерена" }, { status: 404 });
    }

    const currentUserRole = await getCompanyRoleForUser(sessionUser.id, invite.companyId);
    if (!canManageCompanyTeam(currentUserRole)) {
      return NextResponse.json({ error: "Нямате права за тази покана" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from("TeamInvite")
      .update({
        status: "REVOKED",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invite:", error);
    return NextResponse.json({ error: "Неуспешно оттегляне на поканата" }, { status: 500 });
  }
}
