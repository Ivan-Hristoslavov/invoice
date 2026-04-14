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
import { FIELD_LIMITS } from "@/lib/validations/field-limits";
import { VAT_PROTOCOL_117_SCENARIOS } from "@/lib/vat-protocol-117-scenarios";

const vatProtocol117Schema = z.object({
  companyId: z.string().min(1, "Компанията е задължителна"),
  clientId: z.string().min(1, "Клиентът (доставчик) е задължителен"),
  issueDate: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Невалидна дата на протокол"),
  taxEventDate: z
    .string()
    .refine((s) => !Number.isNaN(Date.parse(s)), "Невалидна дата на данъчно събитие"),
  scenario: z
    .string()
    .refine(
      (v) => VAT_PROTOCOL_117_SCENARIOS.some((s) => s.value === v),
      "Изберете валиден сценарий по чл. 117"
    ),
  supplierInvoiceNumber: z.string().max(120).optional().nullable(),
  supplierInvoiceDate: z
    .string()
    .optional()
    .nullable()
    .refine((s) => !s || !Number.isNaN(Date.parse(s)), "Невалидна дата на фактура на доставчик"),
  placeOfIssue: z.string().max(200).optional().nullable(),
  legalBasisNote: z.string().max(FIELD_LIMITS.notes).optional().nullable(),
  currency: z.string().default("EUR"),
  notes: z.string().max(FIELD_LIMITS.notes, "Бележките са твърде дълги").optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1, "Описанието на артикула е задължително"),
        quantity: z.number().min(0.01, "Количеството трябва да е положително"),
        unitPrice: z.number().min(0.01, "Цената трябва да е положителна"),
        taxRate: z
          .number()
          .min(0, "ДДС не може да е отрицателно")
          .max(100, "ДДС не може да надвишава 100%")
          .default(0),
      })
    )
    .min(1, "Трябва да има поне един ред"),
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
    const validatedData = vatProtocol117Schema.parse(body);

    const supabase = createAdminClient();
    const { company, client } = await fetchOwnedCompanyAndClient(
      supabase,
      sessionUser.id,
      validatedData.companyId,
      validatedData.clientId
    );

    if (!company) {
      return NextResponse.json({ error: "Компанията не е намерена" }, { status: 404 });
    }

    if (!client) {
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    const productIds = validatedData.items
      .map((item) => item.productId)
      .filter((productId): productId is string => Boolean(productId));
    const productById = await fetchProductsByIds(supabase, sessionUser.id, productIds);
    const { preparedItems: items, subtotal, taxAmount, total } = prepareDocumentItems(
      validatedData.items,
      productById
    );

    const protocolId = cuid();
    const maxRetries = 3;
    let protocolNumber = "";
    let protocolRow: any = null;
    let protocolError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      protocolNumber = await getNextDocumentNumber({
        supabase,
        table: "VatProtocol117",
        numberColumn: "protocolNumber",
        userId: company.userId,
        companyId: validatedData.companyId,
        companyEik: company.bulstatNumber,
        type: "vat-protocol-117",
      });

      const supplierInvoiceDateIso = validatedData.supplierInvoiceDate
        ? new Date(validatedData.supplierInvoiceDate).toISOString()
        : null;

      const result = await supabase
        .from("VatProtocol117")
        .insert({
          id: protocolId,
          protocolNumber,
          companyId: validatedData.companyId,
          clientId: validatedData.clientId,
          userId: company.userId,
          issueDate: new Date(validatedData.issueDate).toISOString(),
          taxEventDate: new Date(validatedData.taxEventDate).toISOString(),
          scenario: validatedData.scenario,
          supplierInvoiceNumber: validatedData.supplierInvoiceNumber?.trim() || null,
          supplierInvoiceDate: supplierInvoiceDateIso,
          placeOfIssue: validatedData.placeOfIssue?.trim() || null,
          legalBasisNote: validatedData.legalBasisNote?.trim() || null,
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

      protocolRow = result.data;
      protocolError = result.error;

      if (!protocolError) {
        break;
      }

      if (protocolError.code !== "23505" || attempt === maxRetries - 1) {
        break;
      }
    }

    if (protocolError) {
      console.error("Error creating VatProtocol117:", protocolError);
      return NextResponse.json(
        { error: "Неуспешно създаване на протокол по чл. 117" },
        { status: 500 }
      );
    }

    const protocolItems = items.map((item) => ({
      id: cuid(),
      vatProtocol117Id: protocolId,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      unit: item.unit,
      taxRate: item.taxRate.toString(),
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      total: item.total.toString(),
    }));

    const { error: itemsError } = await supabase.from("VatProtocol117Item").insert(protocolItems);

    if (itemsError) {
      await supabase.from("VatProtocol117Item").delete().eq("vatProtocol117Id", protocolId);
      await supabase.from("VatProtocol117").delete().eq("id", protocolId);

      console.error("Error creating VatProtocol117 items:", itemsError);
      return NextResponse.json(
        { error: "Неуспешно създаване на редовете към протокола" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vatProtocol117: {
        id: protocolId,
        protocolNumber,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Невалидни данни", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating VatProtocol117:", error);
    return NextResponse.json(
      { error: "Неуспешно създаване на протокол по чл. 117" },
      { status: 500 }
    );
  }
}
