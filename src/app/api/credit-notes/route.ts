import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import cuid from "cuid";
import { z } from "zod";

const creditNoteSchema = z.object({
  companyId: z.string().min(1, "ID на компанията е задължително"),
  clientId: z.string().min(1, "ID на клиента е задължително"),
  invoiceId: z.string().optional(),
  issueDate: z.string(),
  reason: z.string().optional(),
  currency: z.string().default("EUR"),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "Описанието е задължително"),
    quantity: z.number().positive("Количеството трябва да е положително"),
    unitPrice: z.number().nonnegative("Единичната цена не може да е отрицателна"),
    taxRate: z.number().min(0).max(100).default(0),
  })).min(1, "Трябва да има поне един артикул"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = creditNoteSchema.parse(body);

    const supabase = createAdminClient();

    // Get company for EIK (needed for numbering)
    const { data: company, error: companyError } = await supabase
      .from("Company")
      .select("id, bulstatNumber")
      .eq("id", validatedData.companyId)
      .eq("userId", session.user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Компанията не е намерена" },
        { status: 404 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let total = 0;

    const items = validatedData.items.map((item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTaxAmount = itemSubtotal * (item.taxRate / 100);
      const itemTotal = itemSubtotal + itemTaxAmount;

      subtotal += itemSubtotal;
      taxAmount += itemTaxAmount;
      total += itemTotal;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTaxAmount,
        total: itemTotal,
      };
    });

    // Generate credit note number using Bulgarian format (per-user, like invoices)
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).toISOString();
    
    // Count credit notes for this user in the current year
    const { count: creditNoteCount } = await supabase
      .from("CreditNote")
      .select("*", { count: "exact", head: true })
      .eq("userId", session.user.id)
      .gte("createdAt", startOfYear);
    
    const sequence = (creditNoteCount || 0) + 1;
    const companyEik = company.bulstatNumber || undefined;
    const creditNoteNumber = generateBulgarianInvoiceNumber(sequence, companyEik, 'credit-note');

    // Create credit note
    const creditNoteId = cuid();
    const { data: creditNote, error: creditNoteError } = await supabase
      .from("CreditNote")
      .insert({
        id: creditNoteId,
        creditNoteNumber,
        invoiceId: validatedData.invoiceId || null,
        companyId: validatedData.companyId,
        clientId: validatedData.clientId,
        userId: session.user.id,
        issueDate: new Date(validatedData.issueDate).toISOString(),
        reason: validatedData.reason || null,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        currency: validatedData.currency,
        notes: validatedData.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (creditNoteError) {
      console.error("Error creating credit note:", creditNoteError);
      return NextResponse.json(
        { error: "Неуспешно създаване на кредитно известие" },
        { status: 500 }
      );
    }

    // Create credit note items
    const creditNoteItems = items.map((item) => ({
      id: cuid(),
      creditNoteId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      taxRate: item.taxRate.toString(),
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      total: item.total.toString(),
    }));

    const { error: itemsError } = await supabase
      .from("CreditNoteItem")
      .insert(creditNoteItems);

    if (itemsError) {
      // Rollback credit note creation
      await supabase.from("CreditNoteItem").delete().eq("creditNoteId", creditNoteId);
      await supabase.from("CreditNote").delete().eq("id", creditNoteId);
      
      return NextResponse.json(
        { error: "Неуспешно създаване на артикулите" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creditNote: {
        id: creditNoteId,
        creditNoteNumber,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating credit note:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на кредитно известие" },
      { status: 500 }
    );
  }
}
