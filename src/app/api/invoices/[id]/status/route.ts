import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveSessionUser } from "@/lib/session-user";

// Valid status transitions for the current invoice lifecycle.
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "VOIDED"],
  ISSUED: ["CANCELLED"],
  PAID: ["CANCELLED"],
  VOIDED: [],
  CANCELLED: [],
};

const DB_TO_STATUS: Record<string, string> = {
  PAID: "ISSUED",
};

export async function PATCH(
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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Невалидно тяло на заявката" },
        { status: 400 }
      );
    }
    
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Статусът е задължителен" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch current invoice - first check if it exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, status, userId")
      .eq("id", id)
      .single();

    if (invoiceError) {
      console.error("Грешка при зареждане на фактура:", invoiceError);
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    // Check ownership
    if (invoice.userId !== sessionUser.id) {
      return NextResponse.json(
        { error: "Достъпът е отказан" },
        { status: 403 }
      );
    }

    // Map current status from DB to app status for validation
    const currentAppStatus = DB_TO_STATUS[invoice.status] || invoice.status;
    
    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[currentAppStatus] || VALID_TRANSITIONS[invoice.status] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { 
          error: `Не може да се промени статуса от ${currentAppStatus} към ${status}. Позволени преходи: ${allowedTransitions.join(", ") || "няма"}` 
        },
        { status: 400 }
      );
    }

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("Invoice")
      .update({
        status,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Грешка при обновяване на статуса на фактура:", updateError);
      return NextResponse.json(
        { error: "Грешка при обновяване на статуса" },
        { status: 500 }
      );
    }

    // Try to log audit action (non-blocking)
    try {
      const { logAction } = await import("@/lib/audit-log");
      const headers = request.headers;
      
      // Determine action type based on new status
      const actionType = status === "VOIDED" ? "VOID" : 
                         status === "ISSUED" ? "ISSUE" : "UPDATE";
      
      await logAction({
        userId: sessionUser.id,
        action: actionType,
        entityType: "INVOICE",
        entityId: id,
        invoiceId: id,
        changes: { 
          previousStatus: invoice.status,
          newStatus: status,
          reason: body.reason || undefined
        },
        ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
        userAgent: headers.get("user-agent") || undefined,
      });
    } catch (auditError) {
      console.error("Неуспешно логване на audit действие:", auditError);
      // Continue - audit logging should not block the response
    }

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Грешка при промяна на статуса на фактура:", error);
    return NextResponse.json(
      { error: "Грешка при промяна на статуса" },
      { status: 500 }
    );
  }
}
