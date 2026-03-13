import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateNextInvoiceNumber } from "@/lib/invoice-number";
import { logAction } from "@/lib/audit-log";
import { resolveSessionUser } from "@/lib/session-user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const userId = sessionUser.id;
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: original, error: fetchError } = await supabase
      .from("Invoice")
      .select("*, items:InvoiceItem(*)")
      .eq("id", id)
      .eq("userId", userId)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: "Фактурата не е намерена" }, { status: 404 });
    }

    const invoiceNumber = await generateNextInvoiceNumber(userId);

    const now = new Date();
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 30);

    const insertPayload = {
      invoiceNumber,
      clientId: original.clientId,
      companyId: original.companyId,
      userId,
      issueDate: now.toISOString(),
      dueDate: dueDate.toISOString(),
      supplyDate: now.toISOString(),
      status: "DRAFT",
      subtotal: Number(original.subtotal),
      taxAmount: Number(original.taxAmount),
      total: Number(original.total),
      discount: original.discount != null ? Number(original.discount) : null,
      currency: original.currency ?? "EUR",
      placeOfIssue: original.placeOfIssue ?? null,
      paymentMethod: original.paymentMethod ?? null,
      notes: original.notes ?? null,
      termsAndConditions: original.termsAndConditions ?? null,
      isOriginal: true,
      isEInvoice: false,
    };

    const { data: newInvoice, error: createError } = await supabase
      .from("Invoice")
      .insert(insertPayload)
      .select("id")
      .single();

    if (createError) {
      console.error("Duplicate invoice insert error:", createError);
      return NextResponse.json(
        { error: "Грешка при дублиране", details: createError.message },
        { status: 500 }
      );
    }

    if (!newInvoice) {
      return NextResponse.json({ error: "Грешка при дублиране" }, { status: 500 });
    }

    const rawItems = Array.isArray(original.items) ? original.items : [];
    if (rawItems.length > 0) {
      const items = rawItems.map((item: { productId?: string | null; description: string; quantity: unknown; unitPrice: unknown; taxRate: unknown; subtotal: unknown; taxAmount: unknown; total: unknown }) => ({
        invoiceId: newInvoice.id,
        productId: item.productId || null,
        description: String(item.description ?? ""),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) ?? 0,
        subtotal: Number(item.subtotal) || 0,
        taxAmount: Number(item.taxAmount) || 0,
        total: Number(item.total) || 0,
      }));
      const { error: itemsError } = await supabase.from("InvoiceItem").insert(items);
      if (itemsError) {
        console.error("Duplicate invoice items insert error:", itemsError);
        return NextResponse.json(
          { error: "Грешка при копиране на артикулите", details: itemsError.message },
          { status: 500 }
        );
      }
    }

    await logAction({
      userId,
      action: "CREATE",
      entityType: "INVOICE",
      entityId: newInvoice.id,
      invoiceId: newInvoice.id,
      changes: { duplicatedFrom: id },
    });

    return NextResponse.json({ id: newInvoice.id, invoiceNumber });
  } catch (error) {
    console.error("Error duplicating invoice:", error);
    return NextResponse.json({ error: "Грешка при дублиране на фактурата" }, { status: 500 });
  }
}
