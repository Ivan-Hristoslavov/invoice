import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit-log";
import cuid from "cuid";

/**
 * POST /api/invoices/[id]/cancel
 * Cancels an ISSUED invoice and creates a credit note
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("Invoice")
      .select(`
        *,
        items:InvoiceItem(*),
        client:Client(id, name),
        company:Company(id, name)
      `)
      .eq("id", id)
      .eq("userId", session.user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only ISSUED invoices can be cancelled
    if (invoice.status !== "ISSUED") {
      return NextResponse.json(
        { error: "Само издадени (ISSUED) фактури могат да бъдат отменени. За чернови (DRAFT) фактури използвайте изтриване." },
        { status: 400 }
      );
    }

    // Check if already cancelled
    if (invoice.cancelledAt) {
      return NextResponse.json(
        { error: "Фактурата вече е отменена." },
        { status: 400 }
      );
    }

    // Parse request body for cancellation reason
    let reason = "Отмяна на фактура";
    try {
      const body = await request.json();
      if (body.reason) {
        reason = body.reason;
      }
    } catch {
      // No body provided, use default reason
    }

    // Generate credit note number
    const currentYear = new Date().getFullYear();
    const { count: creditNoteCount } = await supabaseAdmin
      .from("CreditNote")
      .select("*", { count: "exact", head: true })
      .eq("companyId", invoice.companyId);
    
    const creditNoteNumber = `CN-${currentYear}-${((creditNoteCount || 0) + 1).toString().padStart(6, '0')}`;

    // Create credit note
    const creditNoteId = cuid();
    const { data: creditNote, error: creditNoteError } = await supabaseAdmin
      .from("CreditNote")
      .insert({
        id: creditNoteId,
        creditNoteNumber,
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        companyId: invoice.companyId,
        userId: session.user.id,
        issueDate: new Date().toISOString(),
        reason,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        currency: invoice.currency,
        status: "ISSUED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (creditNoteError) {
      console.error("Error creating credit note:", creditNoteError);
      return NextResponse.json(
        { error: "Failed to create credit note" },
        { status: 500 }
      );
    }

    // Create credit note items (copy from invoice items)
    if (invoice.items && invoice.items.length > 0) {
      const creditNoteItems = invoice.items.map((item: any) => ({
        id: cuid(),
        creditNoteId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: item.subtotal,
        taxAmount: item.taxAmount,
        total: item.total,
        productId: item.productId,
      }));

      await supabaseAdmin
        .from("CreditNoteItem")
        .insert(creditNoteItems);
    }

    // Update the original invoice
    const { error: updateError } = await supabaseAdmin
      .from("Invoice")
      .update({
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        cancelledBy: session.user.id,
        creditNoteId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating invoice:", updateError);
      // Rollback credit note creation
      await supabaseAdmin.from("CreditNoteItem").delete().eq("creditNoteId", creditNoteId);
      await supabaseAdmin.from("CreditNote").delete().eq("id", creditNoteId);
      return NextResponse.json(
        { error: "Failed to update invoice" },
        { status: 500 }
      );
    }

    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: session.user.id as string,
      action: "CANCEL",
      entityType: "INVOICE",
      entityId: id,
      invoiceId: id,
      changes: { reason, creditNoteId, creditNoteNumber },
      ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
      userAgent: headers.get("user-agent") || undefined,
    });

    // Revalidate paths
    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      message: "Фактурата е отменена успешно. Създадено е кредитно известие.",
      creditNote: {
        id: creditNoteId,
        creditNoteNumber,
        total: invoice.total,
      },
    });
  } catch (error) {
    console.error("Error cancelling invoice:", error);
    return NextResponse.json(
      { error: "Error cancelling invoice" },
      { status: 500 }
    );
  }
}
