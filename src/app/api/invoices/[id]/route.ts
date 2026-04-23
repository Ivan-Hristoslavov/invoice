import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAction } from "@/lib/audit-log";
import cuid from "cuid";
import { resolveSessionUser } from "@/lib/session-user";
import {
  createDocumentSnapshots,
  fetchOwnedCompanyAndClient,
  fetchProductsByIds,
  prepareDocumentItems,
} from "@/lib/invoice-documents";
import { createGoodsRecipientSnapshot, withDocumentSnapshots } from "@/lib/document-snapshots";
import { normalizeInvoiceStatus } from "@/lib/invoice-status";
import {
  invoiceGoodsRecipientSchema,
  supplyTypeSchema,
  SUPPLY_TYPES_REQUIRING_ZERO_VAT,
} from "@/lib/validations/forms";

// Helper function removed - no longer needed with Supabase

// Schema for invoice update validation
const invoiceItemSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(), // Can be number, string or undefined for new items
  productId: z.string().optional(),
  description: z.string().min(1, "Описанието е задължително"),
  quantity: z.number().min(0.01, "Количеството трябва да е по-голямо от 0"),
  unitPrice: z.number().min(0.01, "Цената е задължителна и трябва да е положителна"),
  taxRate: z.number().min(0, "ДДС не може да е отрицателно"),
  vatExemptReason: z.string().max(500).optional(),
});

const invoiceUpdateSchema = z
  .object({
    invoiceNumber: z.string().min(1, "Номерът на фактурата е задължителен"),
    clientId: z.string().min(1, "Клиентът е задължителен"),
    companyId: z.string().min(1, "Компанията е задължителна"),
    issueDate: z.string().min(1, "Дата на издаване е задължителна"),
    dueDate: z.string().min(1, "Падежната дата е задължителна"),
    supplyDate: z.string().optional(),
    currency: z.string().min(1, "Валутата е задължителна"),
    placeOfIssue: z.string().optional(),
    paymentMethod: z.string().optional(),
    isEInvoice: z.boolean().optional(),
    isOriginal: z.boolean().optional(),
    reverseCharge: z.boolean().optional(),
    supplyType: supplyTypeSchema.optional(),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, "Нужен е поне един артикул"),
    goodsRecipient: invoiceGoodsRecipientSchema,
  })
  .superRefine((data, ctx) => {
    if (data.supplyType && SUPPLY_TYPES_REQUIRING_ZERO_VAT.includes(data.supplyType)) {
      const nonZeroItem = data.items.find((item) => Number(item.taxRate) !== 0);
      if (nonZeroItem) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "При избран тип на доставката с нулева ставка всички артикули трябва да са с ДДС 0%",
          path: ["items"],
        });
      }
    }
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (Number(item.taxRate) === 0 && !item.vatExemptReason?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "При ДДС ставка 0% е необходимо основание за освобождаване (напр. чл. 69, ал. 2 ЗДДС)",
          path: ["items", i, "vatExemptReason"],
        });
      }
    }
  });

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return Response.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();
    
    // First, check if invoice exists at all
    const { data: invoiceCheck, error: checkError } = await supabase
      .from("Invoice")
      .select("id, userId")
      .eq("id", id)
      .single();

    if (checkError || !invoiceCheck) {
      console.error("Фактурата не е намерена:", id, checkError);
      return Response.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    // Check if user has access (owner or admin)
    if (invoiceCheck.userId !== sessionUser.id) {
      console.error("Отказан достъп: потребител", sessionUser.id, "опита да достъпи фактура на", invoiceCheck.userId);
      return Response.json({ error: "Достъпът е отказан" }, { status: 403 });
    }

    // Fetch full invoice data
    const { data: invoice, error } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      console.error("Грешка при зареждане на детайли за фактура:", error);
      return Response.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    // Fetch related data separately
    const [clientResult, companyResult, itemsResult, creditNoteResult, debitNotesResult] =
      await Promise.all([
        supabase
          .from("Client")
          .select(
            "id, name, email, phone, address, city, country, bulstatNumber, mol, vatNumber, vatRegistrationNumber, vatRegistered"
          )
          .eq("id", invoice.clientId)
          .single(),
        supabase.from("Company").select("id, name, email, phone").eq("id", invoice.companyId).single(),
        supabase.from("InvoiceItem").select("*").eq("invoiceId", id),
        supabase.from("CreditNote").select("*").eq("invoiceId", id).maybeSingle(),
        supabase.from("DebitNote").select("*").eq("invoiceId", id),
      ]);

    const fullInvoice = {
      ...withDocumentSnapshots(
        invoice,
        companyResult.data,
        clientResult.data,
        itemsResult.data || []
      ),
      status: normalizeInvoiceStatus(invoice.status),
      persistedStatus: invoice.status,
      creditNote: creditNoteResult.data,
      debitNotes: debitNotesResult.data ?? [],
    };

    return Response.json(fullInvoice);
  } catch (error) {
    console.error("Грешка при зареждане на фактура:", error);
    return Response.json(
      { error: "Грешка при зареждане на фактура" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return Response.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (invoiceError || !invoice) {
      return Response.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    // Invoices are immutable after ISSUED - only DRAFT can be edited
    if (invoice.status !== "DRAFT") {
      return Response.json(
        { error: "Фактурите могат да се редактират само в статус DRAFT. За отмяна на издадена фактура използвайте функцията за създаване на кредитно известие." },
        { status: 400 }
      );
    }

    const rawBody = await request.json();
    const data = invoiceUpdateSchema.parse(rawBody);
    const shouldPatchGoodsRecipient = Object.prototype.hasOwnProperty.call(
      rawBody,
      "goodsRecipient"
    );
    const { company, client } = await fetchOwnedCompanyAndClient(
      supabase,
      sessionUser.id,
      data.companyId,
      data.clientId
    );

    if (!company) {
      return Response.json({ error: "Компанията не е намерена" }, { status: 404 });
    }

    if (!client) {
      return Response.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    const productIds = data.items
      .map((item) => item.productId)
      .filter((productId): productId is string => Boolean(productId));
    const productById = await fetchProductsByIds(
      supabase,
      sessionUser.id,
      productIds
    );
    const preparedInputItems = data.items.map((item: any) => ({
      ...item,
      id: cuid(),
    }));
    const { preparedItems, subtotal, taxAmount, total } = prepareDocumentItems(
      preparedInputItems,
      productById
    );
    const items = preparedItems.map((item) => ({
      id: item.id,
      invoiceId: id,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      unit: item.unit,
      taxRate: item.taxRate.toString(),
      vatExemptReason: item.vatExemptReason ?? null,
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      total: item.total.toString(),
      productId: item.productId || null,
    }));
    const previousItems = (await supabase
      .from("InvoiceItem")
      .select("*")
      .eq("invoiceId", id)).data || [];

    // Delete existing items
    const { error: deleteItemsError } = await supabase
      .from("InvoiceItem")
      .delete()
      .eq("invoiceId", id);

    if (deleteItemsError) {
      throw deleteItemsError;
    }

    // Create new items
    const { error: insertItemsError } = await supabase
      .from("InvoiceItem")
      .insert(items);

    if (insertItemsError) {
      if (previousItems.length > 0) {
        await supabase.from("InvoiceItem").insert(previousItems);
      }
      throw insertItemsError;
    }

    const invoiceUpdatePayload: Record<string, unknown> = {
      clientId: data.clientId,
      companyId: data.companyId,
      issueDate: new Date(data.issueDate).toISOString(),
      dueDate: new Date(data.dueDate).toISOString(),
      supplyDate: data.supplyDate ? new Date(data.supplyDate).toISOString() : new Date(data.issueDate).toISOString(),
      currency: data.currency,
      placeOfIssue: data.placeOfIssue || invoice.placeOfIssue || "София",
      paymentMethod:
        data.paymentMethod === "CARD"
          ? "CREDIT_CARD"
          : data.paymentMethod || invoice.paymentMethod || "BANK_TRANSFER",
      isEInvoice: data.isEInvoice !== undefined ? data.isEInvoice : invoice.isEInvoice,
      isOriginal: data.isOriginal !== undefined ? data.isOriginal : invoice.isOriginal,
      reverseCharge:
        data.reverseCharge !== undefined ? data.reverseCharge : invoice.reverseCharge ?? false,
      supplyType: data.supplyType || invoice.supplyType || "DOMESTIC",
      notes: data.notes || null,
      termsAndConditions: data.termsAndConditions || null,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      bulstatNumber: company.bulstatNumber || null,
      ...createDocumentSnapshots(company, client, preparedItems, productById),
      updatedAt: new Date().toISOString(),
    };
    if (shouldPatchGoodsRecipient) {
      invoiceUpdatePayload.goodsRecipientSnapshot = createGoodsRecipientSnapshot(
        data.goodsRecipient ?? null
      );
    }

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("Invoice")
      .update(invoiceUpdatePayload)
      .eq("id", id)
      .select()
      .single();
    
    if (updateError) {
      await supabase.from("InvoiceItem").delete().eq("invoiceId", id);
      if (previousItems.length > 0) {
        await supabase.from("InvoiceItem").insert(previousItems);
      }
      throw updateError;
    }
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
      action: 'UPDATE',
      entityType: 'INVOICE',
      entityId: id,
      invoiceId: id,
      changes: { updatedFields: Object.keys(data) },
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
    });

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return Response.json({
      ...updatedInvoice,
      status: normalizeInvoiceStatus(updatedInvoice.status),
      persistedStatus: updatedInvoice.status,
    });
  } catch (error) {
    console.error("Грешка при обновяване на фактура:", error);
    return Response.json(
      { error: "Грешка при обновяване на фактура" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Потребителят не е намерен" },
        { status: 404 }
      );
    }
    const supabase = createAdminClient();
    
    // Check if invoice exists and belongs to user
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", invoiceId)
      .eq("userId", sessionUser.id)
      .single();

    if (invoiceError || !existingInvoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }
    
    if (existingInvoice.status !== "DRAFT") {
      return NextResponse.json(
        {
          error:
            "Само чернови фактури могат да бъдат изтривани. За издадени фактури използвайте анулиране и кредитно известие.",
        },
        { status: 400 }
      );
    }

    // Delete related invoice items (cascade should handle this, but we do it explicitly)
    const { error: deleteInvoiceItemsError } = await supabase
      .from("InvoiceItem")
      .delete()
      .eq("invoiceId", invoiceId);
    if (deleteInvoiceItemsError) {
      throw deleteInvoiceItemsError;
    }
    
    // Delete related documents
    const { error: deleteDocumentsError } = await supabase
      .from("Document")
      .delete()
      .eq("invoiceId", invoiceId);
    if (deleteDocumentsError) {
      throw deleteDocumentsError;
    }
    
    // Delete the invoice
    const { error: deleteInvoiceError } = await supabase
      .from("Invoice")
      .delete()
      .eq("id", invoiceId);
    if (deleteInvoiceError) {
      throw deleteInvoiceError;
    }
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
      action: 'DELETE',
      entityType: 'INVOICE',
      entityId: invoiceId,
      invoiceId: invoiceId,
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Грешка при изтриване на фактура:", error);
    return NextResponse.json(
      { error: "Неуспешно изтриване на фактура" },
      { status: 500 }
    );
  }
} 