import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { getNextDocumentNumber } from "@/lib/document-numbering";
import {
  createDocumentSnapshots,
  fetchOwnedCompanyAndClient,
  fetchProductsByIds,
  prepareDocumentItems,
} from "@/lib/invoice-documents";
import cuid from "cuid";
import { z } from "zod";

const debitNoteSchema = z.object({
  companyId: z.string().min(1, "ID на компанията е задължително"),
  clientId: z.string().min(1, "ID на клиента е задължително"),
  invoiceId: z.string().optional(),
  issueDate: z.string(),
  reason: z.string().trim().min(1, "Причината е задължителна"),
  currency: z.string().default("EUR"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
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
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = debitNoteSchema.parse(body);

    const supabase = createAdminClient();
    const { company, client } = await fetchOwnedCompanyAndClient(
      supabase,
      sessionUser.id,
      validatedData.companyId,
      validatedData.clientId
    );

    if (!company) {
      return NextResponse.json(
        { error: "Компанията не е намерена" },
        { status: 404 }
      );
    }

    if (!client) {
      return NextResponse.json(
        { error: "Клиентът не е намерен" },
        { status: 404 }
      );
    }

    if (validatedData.invoiceId) {
      const { data: sourceInvoice, error: sourceInvoiceError } = await supabase
        .from("Invoice")
        .select("id, status, companyId, clientId, userId")
        .eq("id", validatedData.invoiceId)
        .eq("userId", sessionUser.id)
        .maybeSingle();

      if (sourceInvoiceError) {
        throw sourceInvoiceError;
      }

      if (!sourceInvoice) {
        return NextResponse.json(
          { error: "Оригиналната фактура не е намерена" },
          { status: 404 }
        );
      }

      if (sourceInvoice.companyId !== validatedData.companyId || sourceInvoice.clientId !== validatedData.clientId) {
        return NextResponse.json(
          { error: "Дебитното известие трябва да използва същата фирма и клиент като оригиналната фактура." },
          { status: 400 }
        );
      }
    }
    const productIds = validatedData.items
      .map((item: any) => item.productId)
      .filter((productId: string | undefined): productId is string => Boolean(productId));
    const productById = await fetchProductsByIds(
      supabase,
      sessionUser.id,
      productIds
    );
    const { preparedItems: items, subtotal, taxAmount, total } =
      prepareDocumentItems(validatedData.items, productById);

    const debitNoteId = cuid();
    const maxRetries = 3;
    let debitNoteNumber = "";
    let debitNote: any = null;
    let debitNoteError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      debitNoteNumber = await getNextDocumentNumber({
        supabase,
        table: "DebitNote",
        numberColumn: "debitNoteNumber",
        userId: sessionUser.id,
        companyId: validatedData.companyId,
        companyEik: company.bulstatNumber,
        type: "debit-note",
      });

      const result = await supabase
        .from("DebitNote")
        .insert({
          id: debitNoteId,
          debitNoteNumber,
          invoiceId: validatedData.invoiceId || null,
          companyId: validatedData.companyId,
          clientId: validatedData.clientId,
          userId: sessionUser.id,
          issueDate: new Date(validatedData.issueDate).toISOString(),
          reason: validatedData.reason,
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          currency: validatedData.currency,
          notes: validatedData.notes || null,
          ...createDocumentSnapshots(company, client, items, productById),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      debitNote = result.data;
      debitNoteError = result.error;

      if (!debitNoteError) {
        break;
      }

      if (debitNoteError.code !== "23505" || attempt === maxRetries - 1) {
        break;
      }
    }

    if (debitNoteError) {
      console.error("Error creating debit note:", debitNoteError);
      return NextResponse.json(
        { error: "Неуспешно създаване на дебитно известие" },
        { status: 500 }
      );
    }

    // Create debit note items
    const debitNoteItems = items.map((item) => ({
      id: cuid(),
      debitNoteId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      unit: item.unit,
      taxRate: item.taxRate.toString(),
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      total: item.total.toString(),
    }));

    const { error: itemsError } = await supabase
      .from("DebitNoteItem")
      .insert(debitNoteItems);

    if (itemsError) {
      // Rollback debit note creation
      await supabase.from("DebitNoteItem").delete().eq("debitNoteId", debitNoteId);
      await supabase.from("DebitNote").delete().eq("id", debitNoteId);
      
      return NextResponse.json(
        { error: "Неуспешно създаване на артикулите" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      debitNote: {
        id: debitNoteId,
        debitNoteNumber,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating debit note:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на дебитно известие" },
      { status: 500 }
    );
  }
}
