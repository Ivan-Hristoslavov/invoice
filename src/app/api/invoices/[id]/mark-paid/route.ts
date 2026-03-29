import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveSessionUser } from "@/lib/session-user";
import { isIssuedLikeStatus } from "@/lib/invoice-status";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    // Parse optional body for paidAt date
    let body: { paidAt?: string } = {};
    try {
      body = await request.json();
    } catch { /* empty body is ok */ }

    const supabase = createAdminClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, status, userId")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    if (invoice.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Достъпът е отказан" }, { status: 403 });
    }

    // Only issued-like invoices can be marked as paid (UNPAID, OVERDUE, ISSUED)
    if (!isIssuedLikeStatus(invoice.status)) {
      return NextResponse.json(
        { error: "Само издадени фактури могат да бъдат маркирани като платени" },
        { status: 400 }
      );
    }

    // Already paid
    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Фактурата вече е маркирана като платена" },
        { status: 400 }
      );
    }

    const paidAt = body.paidAt ? new Date(body.paidAt).toISOString() : new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("Invoice")
      .update({
        status: "PAID",
        paidAt,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Грешка при обновяване" }, { status: 500 });
    }

    // Audit log
    try {
      const { logAction } = await import("@/lib/audit-log");
      const headers = request.headers;
      await logAction({
        userId: sessionUser.id,
        action: "UPDATE",
        entityType: "INVOICE",
        entityId: id,
        invoiceId: id,
        changes: { previousStatus: invoice.status, newStatus: "PAID", paidAt },
        ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
        userAgent: headers.get("user-agent") || undefined,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");

    return NextResponse.json({ ...updated, status: "PAID" });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json({ error: "Грешка при маркиране като платена" }, { status: 500 });
  }
}
