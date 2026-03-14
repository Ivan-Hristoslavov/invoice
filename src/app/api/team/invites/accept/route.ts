import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { normalizeTeamInviteEmail } from "@/lib/team";
import { supabaseAdmin } from "@/lib/supabase";

const AcceptInviteSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Необходим е вход в системата" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser?.email) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const { token } = AcceptInviteSchema.parse(await request.json());

    const { data: invite } = await supabaseAdmin
      .from("TeamInvite")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (!invite) {
      return NextResponse.json({ error: "Поканата не е намерена" }, { status: 404 });
    }

    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Поканата вече не е активна" }, { status: 409 });
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      await supabaseAdmin
        .from("TeamInvite")
        .update({ status: "EXPIRED", updatedAt: new Date().toISOString() })
        .eq("id", invite.id);

      return NextResponse.json({ error: "Поканата е изтекла" }, { status: 410 });
    }

    if (normalizeTeamInviteEmail(sessionUser.email) !== normalizeTeamInviteEmail(invite.email)) {
      return NextResponse.json(
        { error: "Поканата е изпратена до друг имейл адрес" },
        { status: 403 }
      );
    }

    const { data: existingMembership } = await supabaseAdmin
      .from("UserRole")
      .select("id")
      .eq("userId", sessionUser.id)
      .eq("companyId", invite.companyId)
      .maybeSingle();

    if (existingMembership) {
      await supabaseAdmin
        .from("TeamInvite")
        .update({
          status: "ACCEPTED",
          invitedUserId: sessionUser.id,
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq("id", invite.id);

      return NextResponse.json({ success: true });
    }

    const membershipId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    const { error: membershipError } = await supabaseAdmin
      .from("UserRole")
      .insert({
        id: membershipId,
        userId: sessionUser.id,
        companyId: invite.companyId,
        role: invite.role,
        updatedAt: nowIso,
      });

    if (membershipError) throw membershipError;

    const { error: inviteError } = await supabaseAdmin
      .from("TeamInvite")
      .update({
        status: "ACCEPTED",
        invitedUserId: sessionUser.id,
        acceptedAt: nowIso,
        updatedAt: nowIso,
      })
      .eq("id", invite.id);

    if (inviteError) throw inviteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Невалидна покана" }, { status: 400 });
    }

    console.error("Error accepting team invite:", error);
    return NextResponse.json({ error: "Неуспешно приемане на поканата" }, { status: 500 });
  }
}
