import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Valid status transitions
// Note: Database enum values might be: DRAFT, UNPAID, PAID, OVERDUE, CANCELLED
// We map ISSUED -> PAID for backward compatibility until DB enum is updated
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["ISSUED", "PAID"],  // Draft can be issued
  ISSUED: ["CANCELLED"],      // Issued can only be cancelled
  PAID: ["CANCELLED"],        // Paid (old name for ISSUED) can only be cancelled
  CANCELLED: [],              // Cancelled is final
};

// Map new status names to database enum values
const STATUS_TO_DB: Record<string, string> = {
  ISSUED: "PAID",  // ISSUED maps to PAID in the database enum
  // All other statuses remain the same
};

// Map database enum values to application status names
const DB_TO_STATUS: Record<string, string> = {
  PAID: "ISSUED",  // PAID in DB means ISSUED in the app
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
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
      console.error("Error fetching invoice:", invoiceError);
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Check ownership
    if (invoice.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Access denied" },
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

    // Map status to database enum value if needed
    const dbStatus = STATUS_TO_DB[status] || status;
    
    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("Invoice")
      .update({
        status: dbStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating invoice status:", updateError);
      return NextResponse.json(
        { error: "Грешка при обновяване на статуса" },
        { status: 500 }
      );
    }

    // Try to log audit action (non-blocking)
    try {
      const { logAction } = await import("@/lib/audit-log");
      const headers = request.headers;
      await logAction({
        userId: session.user.id as string,
        action: "UPDATE",
        entityType: "INVOICE",
        entityId: id,
        invoiceId: id,
        changes: { 
          previousStatus: invoice.status,
          newStatus: status 
        },
        ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
        userAgent: headers.get("user-agent") || undefined,
      });
    } catch (auditError) {
      console.error("Failed to log audit action:", auditError);
      // Continue - audit logging should not block the response
    }

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("Error changing invoice status:", error);
    return NextResponse.json(
      { error: "Грешка при промяна на статуса" },
      { status: 500 }
    );
  }
}
