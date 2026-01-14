import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { logAction } from "@/lib/audit-log";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import cuid from "cuid";
import { z } from "zod";

const cancelInvoiceSchema = z.object({
  reason: z.string().min(1, "Причината за отмяна е задължителна"),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check subscription limits - кредитни известия
    const creditNoteLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'creditNotes'
    );
    
    if (!creditNoteLimitCheck.allowed) {
      return NextResponse.json(
        { error: creditNoteLimitCheck.message || "Кредитните известия не са налични за вашия план" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = cancelInvoiceSchema.parse(body);
    
    const supabase = createAdminClient();
    
    // Get invoice with all relations
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(*),
        company:Company(*),
        items:InvoiceItem(*)
      `)
      .eq("id", id)
      .eq("userId", session.user.id)
      .single();
    
    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }
    
    // Only ISSUED invoices can be cancelled
    if (invoice.status !== "ISSUED") {
      return NextResponse.json(
        { error: "Можете да отмените само издадени фактури (ISSUED). Фактурите в статус DRAFT могат да се изтрият директно." },
        { status: 400 }
      );
    }
    
    // Check if already cancelled
    if (invoice.status === "CANCELLED" || invoice.creditNoteId) {
      return NextResponse.json(
        { error: "Фактурата вече е отменена" },
        { status: 400 }
      );
    }
    
    // Get next credit note sequence
    const currentYear = new Date().getFullYear();
    const { data: existingSequence } = await supabase
      .from("InvoiceSequence")
      .select("sequence")
      .eq("companyId", invoice.companyId)
      .eq("year", currentYear)
      .single();
    
    const nextSequence = existingSequence ? existingSequence.sequence + 1 : 1;
    
    // Generate credit note number
    const creditNoteNumber = generateBulgarianInvoiceNumber(
      nextSequence,
      invoice.company?.bulstatNumber || undefined,
      'credit-note'
    );
    
    const creditNoteId = cuid();
    
    // Create credit note
    const creditNoteData = {
      id: creditNoteId,
      creditNoteNumber,
      invoiceId: id,
      companyId: invoice.companyId,
      clientId: invoice.clientId,
      userId: session.user.id,
      issueDate: new Date().toISOString(),
      reason: validatedData.reason,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency || "EUR",
      notes: `Кредитно известие за фактура ${invoice.invoiceNumber}. Причина: ${validatedData.reason}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const { data: creditNote, error: creditNoteError } = await supabase
      .from("CreditNote")
      .insert(creditNoteData)
      .select()
      .single();
    
    if (creditNoteError) {
      throw creditNoteError;
    }
    
    // Create credit note items (copy from invoice items)
    const creditNoteItems = (invoice.items || []).map((item: any) => ({
      id: cuid(),
      creditNoteId: creditNoteId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      subtotal: item.subtotal,
      taxAmount: item.taxAmount,
      total: item.total,
    }));
    
    if (creditNoteItems.length > 0) {
      await supabase
        .from("CreditNoteItem")
        .insert(creditNoteItems);
    }
    
    // Update invoice status to CANCELLED and link credit note
    await supabase
      .from("Invoice")
      .update({
        status: "CANCELLED",
        cancelledAt: new Date().toISOString(),
        cancelledBy: session.user.id,
        creditNoteId: creditNoteId,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);
    
    // Update sequence
    if (existingSequence) {
      await supabase
        .from("InvoiceSequence")
        .update({
          sequence: nextSequence,
          updatedAt: new Date().toISOString(),
        })
        .eq("companyId", invoice.companyId)
        .eq("year", currentYear);
    } else {
      await supabase
        .from("InvoiceSequence")
        .insert({
          id: cuid(),
          companyId: invoice.companyId,
          year: currentYear,
          sequence: nextSequence,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
    }
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: session.user.id as string,
      action: 'CANCEL',
      entityType: 'INVOICE',
      entityId: id,
      invoiceId: id,
      changes: { reason: validatedData.reason, creditNoteId },
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
    });
    
    // Log credit note creation
    await logAction({
      userId: session.user.id as string,
      action: 'CREATE',
      entityType: 'CREDIT_NOTE',
      entityId: creditNoteId,
      invoiceId: id,
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
    });
    
    return NextResponse.json({
      success: true,
      creditNote,
      message: "Фактурата е отменена и кредитното известие е създадено успешно",
    });
  } catch (error) {
    console.error("Error cancelling invoice:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to cancel invoice" },
      { status: 500 }
    );
  }
}
