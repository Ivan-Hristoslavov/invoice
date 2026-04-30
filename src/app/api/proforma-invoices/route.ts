import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import cuid from "cuid";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchOwnedCompanyAndClient, fetchProductsByIds, prepareDocumentItems, createDocumentSnapshots } from "@/lib/invoice-documents";
import { getNextProformaSequence, rollbackProformaSequence } from "@/lib/invoice-sequence";

const proformaSchema = z.object({
  clientId: z.string().min(1),
  companyId: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default("EUR"),
  paymentMethod: z.string().optional().default("BANK_TRANSFER"),
  accountType: z.string().optional().default("BUSINESS"),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().optional(),
        description: z.string().min(1),
        quantity: z.number().min(0.01),
        price: z.number().min(0.01),
        taxRate: z.number().min(0).max(100).default(20),
      })
    )
    .min(1),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });

  const params = request.nextUrl.searchParams;
  const supabase = createAdminClient();
  let query = supabase
    .from("ProformaInvoice")
    .select("*, client:Client(id,name)")
    .eq("userId", sessionUser.id)
    .order("issueDate", { ascending: false });

  if (params.get("fromDate")) query = query.gte("issueDate", params.get("fromDate") as string);
  if (params.get("toDate")) query = query.lte("issueDate", params.get("toDate") as string);
  if (params.get("clientId")) query = query.eq("clientId", params.get("clientId") as string);
  if (params.get("paymentMethod")) query = query.eq("paymentMethod", params.get("paymentMethod") as string);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data || [] });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });

  const body = proformaSchema.parse(await request.json());
  const supabase = createAdminClient();
  const { company, client } = await fetchOwnedCompanyAndClient(
    supabase,
    sessionUser.id,
    body.companyId,
    body.clientId
  );
  if (!company || !client) {
    return NextResponse.json({ error: "Компания или клиент не са намерени" }, { status: 404 });
  }

  const productIds = body.items.map((item) => item.productId).filter((v): v is string => Boolean(v));
  const productById = await fetchProductsByIds(supabase, sessionUser.id, productIds);
  const preparedInputItems = body.items.map((item) => ({
    ...item,
    id: cuid(),
    unitPrice: item.price,
  }));
  const { preparedItems, subtotal, taxAmount, total } = prepareDocumentItems(preparedInputItems, productById);

  const proformaId = cuid();
  const { sequence, proformaNumber } = await getNextProformaSequence(sessionUser.id, body.companyId);
  const { error: insertError } = await supabase.from("ProformaInvoice").insert({
    id: proformaId,
    proformaNumber,
    clientId: body.clientId,
    companyId: body.companyId,
    userId: sessionUser.id,
    issueDate: new Date(body.issueDate).toISOString(),
    dueDate: body.dueDate ? new Date(body.dueDate).toISOString() : null,
    status: "DRAFT",
    subtotal: subtotal.toString(),
    taxAmount: taxAmount.toString(),
    total: total.toString(),
    notes: body.notes || null,
    currency: body.currency,
    paymentMethod: body.paymentMethod,
    accountType: body.accountType || "BUSINESS",
    ...createDocumentSnapshots(company, client, preparedItems, productById),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (insertError) {
    await rollbackProformaSequence(sessionUser.id, body.companyId, sequence);
    return NextResponse.json({ error: "Неуспешно създаване на проформа" }, { status: 500 });
  }

  const itemRows = preparedItems.map((item) => ({
    id: item.id,
    proformaInvoiceId: proformaId,
    productId: item.productId || null,
    description: item.description,
    quantity: item.quantity.toString(),
    unitPrice: item.unitPrice.toString(),
    unit: item.unit,
    taxRate: item.taxRate.toString(),
    subtotal: item.subtotal.toString(),
    taxAmount: item.taxAmount.toString(),
    total: item.total.toString(),
  }));
  const { error: itemsError } = await supabase.from("ProformaInvoiceItem").insert(itemRows);
  if (itemsError) {
    await supabase.from("ProformaInvoice").delete().eq("id", proformaId);
    await rollbackProformaSequence(sessionUser.id, body.companyId, sequence);
    return NextResponse.json({ error: "Неуспешно създаване на артикули" }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: proformaId, proformaNumber });
}
