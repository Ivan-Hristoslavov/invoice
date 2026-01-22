import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAction } from "@/lib/audit-log";
import cuid from "cuid";

// Helper function removed - no longer needed with Supabase

// Schema for invoice update validation
const invoiceItemSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(), // Can be number, string or undefined for new items
  description: z.string().min(1, "Описанието е задължително"),
  quantity: z.number().min(0.01, "Количеството трябва да е по-голямо от 0"),
  unitPrice: z.number().min(0, "Единичната цена не може да е отрицателна"),
  taxRate: z.number().min(0, "ДДС не може да е отрицателно"),
});

const invoiceUpdateSchema = z.object({
  invoiceNumber: z.string().min(1, "Номерът на фактурата е задължителен"),
  clientId: z.string().min(1, "Клиентът е задължителен"),
  companyId: z.string().min(1, "Компанията е задължителна"),
  issueDate: z.string().min(1, "Дата на издаване е задължителна"),
  dueDate: z.string().min(1, "Падежната дата е задължителна"),
  currency: z.string().min(1, "Валутата е задължителна"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Нужен е поне един артикул"),
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
    if (invoiceCheck.userId !== session.user.id) {
      console.error("Отказан достъп: потребител", session.user.id, "опита да достъпи фактура на", invoiceCheck.userId);
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
    const [clientResult, companyResult, itemsResult, creditNoteResult] = await Promise.all([
      supabase.from("Client").select("id, name, email, phone, address, city, country").eq("id", invoice.clientId).single(),
      supabase.from("Company").select("id, name, email, phone").eq("id", invoice.companyId).single(),
      supabase.from("InvoiceItem").select("*").eq("invoiceId", id),
      supabase.from("CreditNote").select("*").eq("invoiceId", id).maybeSingle()
    ]);

    const fullInvoice = {
      ...invoice,
      client: clientResult.data,
      company: companyResult.data,
      items: itemsResult.data || [],
      creditNote: creditNoteResult.data
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

    const supabase = createAdminClient();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", id)
      .eq("userId", session.user.id)
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

    const data = await request.json();

    // Calculate totals from items
    let subtotal = 0;
    let taxAmount = 0;
    
    const items = data.items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      const itemTotal = itemSubtotal + itemTax;
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;
      
      return {
        id: cuid(),
        invoiceId: id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        taxRate: item.taxRate.toString(),
        subtotal: itemSubtotal.toString(),
        taxAmount: itemTax.toString(),
        total: itemTotal.toString(),
        productId: item.productId || null,
      };
    });
    
    const total = subtotal + taxAmount;

    // Delete existing items
    await supabase
      .from("InvoiceItem")
      .delete()
      .eq("invoiceId", id);

    // Create new items
    await supabase
      .from("InvoiceItem")
      .insert(items);

    // Update invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("Invoice")
      .update({
        clientId: data.clientId,
        companyId: data.companyId,
        issueDate: new Date(data.issueDate).toISOString(),
        dueDate: new Date(data.dueDate).toISOString(),
        currency: data.currency,
        notes: data.notes || null,
        termsAndConditions: data.termsAndConditions || null,
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        total: total.toString(),
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: session.user.id as string,
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

    return Response.json(updatedInvoice);
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
    const supabase = createAdminClient();
    
    // Check if invoice exists and belongs to user
    const { data: existingInvoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("*")
      .eq("id", invoiceId)
      .eq("userId", session.user.id)
      .single();

    if (invoiceError || !existingInvoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }
    
    // Delete related invoice items (cascade should handle this, but we do it explicitly)
    await supabase
      .from("InvoiceItem")
      .delete()
      .eq("invoiceId", invoiceId);
    
    // Delete related documents
    await supabase
      .from("Document")
      .delete()
      .eq("invoiceId", invoiceId);
    
    // Delete the invoice
    await supabase
      .from("Invoice")
      .delete()
      .eq("id", invoiceId);
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: session.user.id as string,
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