import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";
import cuid from "cuid";

// Define InvoiceStatus type locally
type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

// Define validation schema for CSV invoice data
const invoiceItemSchema = z.object({
  description: z.string().min(1, "Описанието е задължително"),
  quantity: z.coerce.number().min(0.01, "Количеството трябва да е по-голямо от 0"),
  unitPrice: z.coerce.number().min(0, "Единичната цена не може да е отрицателна"),
  taxRate: z.coerce.number().min(0, "ДДС не може да е отрицателно").default(0),
  productId: z.string().optional(),
});

const importInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Номерът на фактурата е задължителен"),
  clientId: z.string().min(1, "Клиентът е задължителен"),
  companyId: z.string().min(1, "Компанията е задължителна"),
  issueDate: z.string().min(1, "Дата на издаване е задължителна"),
  dueDate: z.string().min(1, "Падежната дата е задължителна"),
  status: z.enum(["DRAFT", "ISSUED", "CANCELLED"]).default("DRAFT"),
  currency: z.string().min(1, "Валутата е задължителна").default("EUR"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Нужен е поне един артикул"),
});

const bulkImportSchema = z.array(importInvoiceSchema);

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    // Get user ID
    const userId = session.user.id;

    // Parse the request
    const body = await request.json();
    
    // Validate the input data
    const validationResult = bulkImportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Невалидни данни", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const invoicesData = validationResult.data;
    const results = [];
    const errors = [];

    // Process each invoice
    for (const invoiceData of invoicesData) {
      try {
        // Check if client exists and belongs to user
        const { data: client, error: clientError } = await supabaseAdmin
          .from('Client')
          .select('id')
          .eq('id', invoiceData.clientId)
          .eq('userId', userId)
          .single();

        if (clientError || !client) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Клиент с ID ${invoiceData.clientId} не е намерен или не принадлежи на потребителя`,
          });
          continue;
        }

        // Check if company exists and belongs to user
        const { data: company, error: companyError } = await supabaseAdmin
          .from('Company')
          .select('id')
          .eq('id', invoiceData.companyId)
          .eq('userId', userId)
          .single();

        if (companyError || !company) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Компания с ID ${invoiceData.companyId} не е намерена или не принадлежи на потребителя`,
          });
          continue;
        }

        // Check if invoice number already exists for this company
        const { data: existingInvoice } = await supabaseAdmin
          .from('Invoice')
          .select('id')
          .eq('invoiceNumber', invoiceData.invoiceNumber)
          .eq('companyId', invoiceData.companyId)
          .single();

        if (existingInvoice) {
          errors.push({
            invoiceNumber: invoiceData.invoiceNumber,
            error: `Номерът на фактура ${invoiceData.invoiceNumber} вече съществува за тази компания`,
          });
          continue;
        }

        // Calculate subtotal, tax amount, and total
        let subtotal = 0;
        let taxAmount = 0;

        const invoiceId = cuid();
        
        const items = invoiceData.items.map((item) => {
          const itemSubtotal = Number(item.quantity) * Number(item.unitPrice);
          const itemTaxAmount = itemSubtotal * (Number(item.taxRate) / 100);
          
          subtotal += itemSubtotal;
          taxAmount += itemTaxAmount;
          
          return {
            id: cuid(),
            invoiceId,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            taxRate: item.taxRate.toString(),
            subtotal: itemSubtotal.toString(),
            taxAmount: itemTaxAmount.toString(),
            total: (itemSubtotal + itemTaxAmount).toString(),
            productId: item.productId || null,
          };
        });

        const total = subtotal + taxAmount;

        // Create the invoice
        const { data: invoice, error: invoiceError } = await supabaseAdmin
          .from('Invoice')
          .insert({
            id: invoiceId,
            invoiceNumber: invoiceData.invoiceNumber,
            clientId: invoiceData.clientId,
            companyId: invoiceData.companyId,
            userId,
            issueDate: new Date(invoiceData.issueDate).toISOString(),
            dueDate: new Date(invoiceData.dueDate).toISOString(),
            status: invoiceData.status as InvoiceStatus,
            subtotal: subtotal.toString(),
            taxAmount: taxAmount.toString(),
            total: total.toString(),
            currency: invoiceData.currency,
            notes: invoiceData.notes || null,
            termsAndConditions: invoiceData.termsAndConditions || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();

        if (invoiceError) {
          throw invoiceError;
        }

        // Create invoice items
        await supabaseAdmin
          .from('InvoiceItem')
          .insert(items);

        results.push({
          invoiceNumber: invoice.invoiceNumber,
          id: invoice.id,
          total: invoice.total,
          status: invoice.status,
        });
      } catch (error: any) {
        errors.push({
          invoiceNumber: invoiceData.invoiceNumber,
          error: error?.message || "Възникна грешка при обработка на тази фактура",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Грешка при масов импорт:", error);
    return NextResponse.json(
      { error: "Неуспешна обработка на импорта", details: error },
      { status: 500 }
    );
  }
}
