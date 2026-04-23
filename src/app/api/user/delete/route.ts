import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

const deleteSchema = z.object({
  confirmation: z.string().min(1, "Потвърждението е задължително"),
});

/**
 * Retention-safe account deletion.
 *
 * Hard-deleting a User row would cascade-delete Invoice, CreditNote, DebitNote,
 * and VatProtocol117 records, which violates ZSch chl. 12, al. 1 (10-year
 * retention of accounting documents). Instead, we:
 *   1. Verify the user owns the account (email confirmation).
 *   2. Purge PII from the User row (name, email, phone, image, password).
 *   3. Scrub PII from AuditLog (IP address, User Agent) while keeping the trail.
 *   4. Delete Sessions, Accounts (OAuth tokens), and pending team invites.
 *   5. Mark the User as deleted/anonymized via timestamps.
 *
 * Invoices and related accounting documents keep their FK to the anonymized
 * User row (now with SET NULL semantics); snapshots already contain the
 * company/client data needed to reprint historical documents.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { confirmation } = deleteSchema.parse(json);

    if (confirmation !== session.user.email) {
      return NextResponse.json(
        { error: "Имейлът за потвърждение не съвпада" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const userId = session.user.id;
    const now = new Date().toISOString();

    await supabase.from("AuditLog").insert({
      userId,
      action: "DELETE_ACCOUNT",
      entityType: "USER",
      entityId: userId,
      changes: JSON.stringify({
        email: session.user.email,
        deletedAt: now,
        retentionPolicy:
          "Invoices retained 10 years per ZSch chl. 12, al. 1; PII anonymized",
      }),
    });

    const anonymizedEmail = `deleted-${userId}@invoicypro.anonymized`;

    const { error: userUpdateError } = await supabase
      .from("User")
      .update({
        email: anonymizedEmail,
        name: null,
        phone: null,
        image: null,
        password: null,
        stripeCustomerId: null,
        deletedAt: now,
        anonymizedAt: now,
        updatedAt: now,
      })
      .eq("id", userId);

    if (userUpdateError) {
      console.error("Error anonymizing user:", userUpdateError);
      return NextResponse.json(
        { error: "Грешка при изтриване на акаунта. Моля, опитайте отново." },
        { status: 500 }
      );
    }

    // Scrub audit log IP/UA (keep the action trail for compliance).
    await supabase
      .from("AuditLog")
      .update({ ipAddress: null, userAgent: null })
      .eq("userId", userId);

    // Remove authentication artefacts so login is no longer possible.
    await supabase.from("Session").delete().eq("userId", userId);
    await supabase.from("Account").delete().eq("userId", userId);
    await supabase.from("PasswordResetToken").delete().eq("userId", userId);
    // Cancel pending team invites sent by this user.
    await supabase
      .from("TeamInvite")
      .update({ status: "CANCELLED", updatedAt: now })
      .eq("invitedByUserId", userId)
      .eq("status", "PENDING");

    return NextResponse.json({
      success: true,
      message:
        "Акаунтът е изтрит. Личните ви данни са премахнати, а счетоводните документи се пазят съгласно чл. 12, ал. 1 ЗСч.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error in delete account:", error);
    return NextResponse.json(
      { error: "Възникна грешка при изтриване на акаунта" },
      { status: 500 }
    );
  }
}
