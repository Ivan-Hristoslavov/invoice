import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import {
  createDocumentSnapshots,
  fetchOwnedCompanyAndClient,
  fetchProductsByIds,
  prepareDocumentItems,
} from "@/lib/invoice-documents";
import {
  getNextInvoiceSequence,
  rollbackInvoiceSequence,
} from "@/lib/invoice-sequence";
import { normalizeInvoiceStatus } from "@/lib/invoice-status";
import cuid from "cuid";
import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

const creditNoteSchema = z.object({
  companyId: z.string().min(1, "Компанията е задължителна"),
  clientId: z.string().min(1, "Клиентът е задължителен"),
  invoiceId: z.string().trim().min(1, "Оригиналната фактура е задължителна"),
  issueDate: z.string().refine((s) => !isNaN(Date.parse(s)), "Невалидна дата"),
  reason: z.string().trim().min(1, "Причината за кредитното известие е задължителна").max(FIELD_LIMITS.reason, "Причината е твърде дълга"),
  currency: z.string().default("EUR"),
  notes: z.string().max(FIELD_LIMITS.notes, "Бележките са твърде дълги").optional(),
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string().min(1, "Описанието на артикула е задължително"),
    quantity: z.number().min(0.01, "Количеството трябва да е положително"),
    unitPrice: z.number().min(0.01, "Цената е задължителна и трябва да е положителна"),
    taxRate: z.number().min(0, "ДДС не може да е отрицателно").max(100, "ДДС не може да надвишава 100%").default(0),
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
    const validatedData = creditNoteSchema.parse(body);

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

    const { data: sourceInvoice, error: sourceInvoiceError } = await supabase
      .from("Invoice")
      .select("id, status, companyId, clientId, userId")
      .eq("id", validatedData.invoiceId)
      .eq("userId", company.userId)
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
        { error: "Кредитното известие трябва да използва същата фирма и клиент като оригиналната фактура." },
        { status: 400 }
      );
    }

    if (normalizeInvoiceStatus(sourceInvoice.status) !== "ISSUED") {
      return NextResponse.json(
        { error: "Кредитно известие може да се създаде само по издадена фактура." },
        { status: 400 }
      );
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

    const creditNoteId = cuid();
    const maxRetries = 3;
    let creditNoteNumber = "";
    let creditNote: any = null;
    let creditNoteError: any = null;
    let issuedSequence: number | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const nextInvoiceNumber = await getNextInvoiceSequence(
        company.userId,
        validatedData.companyId,
        company.bulstatNumber
      );
      creditNoteNumber = nextInvoiceNumber.invoiceNumber;
      issuedSequence = nextInvoiceNumber.sequence;

      const result = await supabase
        .from("CreditNote")
        .insert({
          id: creditNoteId,
          creditNoteNumber,
          invoiceId: validatedData.invoiceId,
          companyId: validatedData.companyId,
          clientId: validatedData.clientId,
          userId: company.userId,
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
      if (issuedSequence !== null) {
        await rollbackInvoiceSequence(company.userId, validatedData.companyId, issuedSequence);
      }
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
      unit: item.unit,
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
      if (issuedSequence !== null) {
        await rollbackInvoiceSequence(company.userId, validatedData.companyId, issuedSequence);
      }
      
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
