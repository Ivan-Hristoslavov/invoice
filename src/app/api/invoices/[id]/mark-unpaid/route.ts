import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveSessionUser } from "@/lib/session-user";

export async function POST(
  _request: NextRequest,
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

    const supabase = createAdminClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, status, userId, paidAt")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    if (invoice.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Достъпът е отказан" }, { status: 403 });
    }

    if (invoice.status !== "PAID") {
      return NextResponse.json(
        { error: "Само платени фактури могат да бъдат маркирани като неплатени" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("Invoice")
      .update({
        status: "UNPAID",
        paidAt: null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Грешка при обновяване" }, { status: 500 });
    }

    try {
      const { logAction } = await import("@/lib/audit-log");
      const headers = _request.headers;
      await logAction({
        userId: sessionUser.id,
        action: "UPDATE",
        entityType: "INVOICE",
        entityId: id,
        invoiceId: id,
        changes: {
          previousStatus: "PAID",
          newStatus: "UNPAID",
          previousPaidAt: invoice.paidAt,
        },
        ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
        userAgent: headers.get("user-agent") || undefined,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");

    return NextResponse.json({ ...updated, status: "UNPAID" });
  } catch (error) {
    console.error("Mark unpaid error:", error);
    return NextResponse.json({ error: "Грешка при маркиране като неплатена" }, { status: 500 });
  }
}
