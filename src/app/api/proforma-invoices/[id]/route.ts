import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { fetchOwnedCompanyAndClient, fetchProductsByIds, prepareDocumentItems, createDocumentSnapshots } from "@/lib/invoice-documents";

const updateSchema = z.object({
  clientId: z.string().min(1),
  companyId: z.string().min(1),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default("EUR"),
  paymentMethod: z.string().optional().default("BANK_TRANSFER"),
  accountType: z.string().optional().default("BUSINESS"),
  notes: z.string().optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    productId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.number().min(0.01),
    price: z.number().min(0.01),
    taxRate: z.number().min(0).max(100).default(20),
  })).min(1),
});

async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return resolveSessionUser(session.user);
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ProformaInvoice")
    .select("*, client:Client(*), company:Company(*), items:ProformaInvoiceItem(*)")
    .eq("id", id)
    .eq("userId", sessionUser.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Проформата не е намерена" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const { id } = await params;
  const payload = updateSchema.parse(await request.json());
  const supabase = createAdminClient();

  const { company, client } = await fetchOwnedCompanyAndClient(supabase, sessionUser.id, payload.companyId, payload.clientId);
  if (!company || !client) return NextResponse.json({ error: "Компания или клиент не са намерени" }, { status: 404 });

  const productIds = payload.items.map((item) => item.productId).filter((v): v is string => Boolean(v));
  const productById = await fetchProductsByIds(supabase, sessionUser.id, productIds);
  const preparedInputItems = payload.items.map((item) => ({ ...item, id: item.id || crypto.randomUUID(), unitPrice: item.price }));
  const { preparedItems, subtotal, taxAmount, total } = prepareDocumentItems(preparedInputItems, productById);

  const { error: updateError } = await supabase
    .from("ProformaInvoice")
    .update({
      clientId: payload.clientId,
      companyId: payload.companyId,
      issueDate: new Date(payload.issueDate).toISOString(),
      dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString() : null,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      notes: payload.notes || null,
      currency: payload.currency,
      paymentMethod: payload.paymentMethod,
      accountType: payload.accountType || "BUSINESS",
      ...createDocumentSnapshots(company, client, preparedItems, productById),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("userId", sessionUser.id);
  if (updateError) return NextResponse.json({ error: "Неуспешно обновяване на проформата" }, { status: 500 });

  await supabase.from("ProformaInvoiceItem").delete().eq("proformaInvoiceId", id);
  const { error: itemsError } = await supabase.from("ProformaInvoiceItem").insert(
    preparedItems.map((item) => ({
      id: item.id,
      proformaInvoiceId: id,
      productId: item.productId || null,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      unit: item.unit,
      taxRate: item.taxRate.toString(),
      subtotal: item.subtotal.toString(),
      taxAmount: item.taxAmount.toString(),
      total: item.total.toString(),
    }))
  );
  if (itemsError) return NextResponse.json({ error: "Неуспешно обновяване на артикули" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("ProformaInvoice").delete().eq("id", id).eq("userId", sessionUser.id);
  if (error) return NextResponse.json({ error: "Неуспешно изтриване" }, { status: 500 });
  return NextResponse.json({ success: true });
}
