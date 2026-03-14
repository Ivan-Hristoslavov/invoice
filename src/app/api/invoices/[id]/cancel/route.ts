import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/audit-log";
import cuid from "cuid";
import { resolveSessionUser } from "@/lib/session-user";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { getNextDocumentNumber } from "@/lib/document-numbering";
import { isIssuedLikeStatus, normalizeInvoiceStatus } from "@/lib/invoice-status";

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
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("Invoice")
      .select(`
        *,
        items:InvoiceItem(*),
        client:Client(*),
        company:Company(*)
      `)
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    // Only issued invoices can be cancelled. Older environments still persist legacy statuses.
    if (!isIssuedLikeStatus(invoice.status)) {
      return NextResponse.json(
        { error: "Само издадени фактури могат да бъдат отменени. За чернови използвайте изтриване или анулиране." },
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

    // Create credit note
    const creditNoteId = cuid();
    const snapshotInvoice = withDocumentSnapshots(
      invoice,
      invoice.company,
      invoice.client,
      invoice.items || []
    );
    const maxRetries = 3;
    let creditNoteNumber = "";
    let creditNote: any = null;
    let creditNoteError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      creditNoteNumber = await getNextDocumentNumber({
        supabase: supabaseAdmin,
        table: "CreditNote",
        numberColumn: "creditNoteNumber",
        userId: sessionUser.id,
        companyId: invoice.companyId,
        companyEik: invoice.company?.bulstatNumber,
        type: "credit-note",
      });

      const result = await supabaseAdmin
        .from("CreditNote")
        .insert({
          id: creditNoteId,
          creditNoteNumber,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          companyId: invoice.companyId,
          userId: sessionUser.id,
          issueDate: new Date().toISOString(),
          reason,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          total: invoice.total,
          currency: invoice.currency,
          sellerSnapshot: snapshotInvoice.company,
          buyerSnapshot: snapshotInvoice.client,
          itemsSnapshot: snapshotInvoice.items,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      creditNote = result.data;
      creditNoteError = result.error;

      if (!creditNoteError) {
        break;
      }

      if (creditNoteError.code !== "23505" || attempt === maxRetries - 1) {
        break;
      }
    }

    if (creditNoteError) {
      console.error("Грешка при създаване на кредитно известие:", creditNoteError);
      return NextResponse.json(
        { error: "Неуспешно създаване на кредитно известие" },
        { status: 500 }
      );
    }

    // Create credit note items (copy from invoice items)
    if (invoice.items && invoice.items.length > 0) {
      const creditNoteItems = snapshotInvoice.items.map((item: any) => ({
        id: cuid(),
        creditNoteId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit || "бр.",
        taxRate: item.taxRate,
        subtotal: item.subtotal,
        taxAmount: item.taxAmount,
        total: item.total,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("CreditNoteItem")
        .insert(creditNoteItems);

      if (itemsError) {
        await supabaseAdmin.from("CreditNote").delete().eq("id", creditNoteId);
        return NextResponse.json(
          { error: "Неуспешно създаване на артикули за кредитното известие" },
          { status: 500 }
        );
      }
    }

    // Update the original invoice
    const { error: updateError } = await supabaseAdmin
      .from("Invoice")
      .update({
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        cancelledBy: sessionUser.id,
        creditNoteId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Грешка при обновяване на фактура:", updateError);
      // Rollback credit note creation
      await supabaseAdmin.from("CreditNoteItem").delete().eq("creditNoteId", creditNoteId);
      await supabaseAdmin.from("CreditNote").delete().eq("id", creditNoteId);
      return NextResponse.json(
        { error: "Неуспешно обновяване на фактура" },
        { status: 500 }
      );
    }

    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
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
      invoiceStatus: normalizeInvoiceStatus("CANCELLED"),
    });
  } catch (error) {
    console.error("Грешка при отмяна на фактура:", error);
    return NextResponse.json(
      { error: "Грешка при отмяна на фактура" },
      { status: 500 }
    );
  }
}
