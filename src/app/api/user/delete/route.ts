import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

const deleteSchema = z.object({
  confirmation: z.string().min(1, "Потвърждението е задължително"),
});

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

    // Verify the confirmation matches the user's email
    if (confirmation !== session.user.email) {
      return NextResponse.json(
        { error: "Имейлът за потвърждение не съвпада" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const userId = session.user.id;

    // Log the deletion attempt in AuditLog before deleting
    await supabase.from("AuditLog").insert({
      userId,
      action: "DELETE_ACCOUNT",
      entityType: "USER",
      entityId: userId,
      changes: JSON.stringify({
        email: session.user.email,
        deletedAt: new Date().toISOString(),
      }),
    });

    // Delete the user - CASCADE will handle all related data:
    // - Companies (and their invoices, sequences)
    // - Clients
    // - Products
    // - Invoices (and items, documents)
    // - Subscriptions (and payments, history)
    // - Sessions
    // - Accounts (OAuth)
    // - UserRoles
    // - CreditNotes
    // - AuditLogs (will be deleted after this log is created)
    const { error: deleteError } = await supabase
      .from("User")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Грешка при изтриване на акаунта. Моля, опитайте отново." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Акаунтът е изтрит успешно. Всички ваши данни са премахнати.",
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
