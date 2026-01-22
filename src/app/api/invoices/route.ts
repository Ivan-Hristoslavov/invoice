import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { withErrorHandling } from "@/middleware/error-handler";
import { withRateLimit } from "@/middleware/rate-limiter";
import { withAuthorization } from "@/middleware/authorization";
import { formatApiResponse, formatPaginationParams } from "@/lib/api-utils";
import { z } from "zod";
import { invoiceSchema, invoiceItemSchema } from "@/lib/validations/forms";
import { ApiStatusCode } from "@/types/api";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import cuid from "cuid";

// Schema для валидация на заявката
const InvoiceQuerySchema = z.object({
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default("issueDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.string().optional(),
  clientId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

// Тип за фактура в отговора
interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  clientId: string;
  companyId: string;
  userId: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  termsAndConditions?: string | null;
  client: {
    id: string;
    name: string;
    email: string | null;
  };
  company: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    price: number;
    taxRate: number;
    total: number;
    productId: string | null;
  }>;
}

// Обработка на GET заявка
export async function GET(request: NextRequest) {
  return withRateLimit(request, () => 
    withErrorHandling(request, () =>
      withAuthorization(request, async () => {
        // Сесията вече е проверена от withAuthorization middleware
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          throw new Error("Неоторизиран достъп");
        }

        // Извличане на параметрите от заявката
        const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const params = InvoiceQuerySchema.parse(searchParams);
        
        // Форматиране на параметрите за пагинация
        const { page, pageSize, sortBy, sortOrder } = formatPaginationParams(params);
        
        // Конструиране на филтри
        const filters: any = {
          userId: session.user.id,
        };
        
        if (params.status) {
          filters.status = params.status;
        }
        
        if (params.clientId) {
          filters.clientId = params.clientId;
        }
        
        if (params.fromDate || params.toDate) {
          filters.issueDate = {};
          
          if (params.fromDate) {
            filters.issueDate.gte = new Date(params.fromDate);
          }
          
          if (params.toDate) {
            filters.issueDate.lte = new Date(params.toDate);
          }
        }
        
        // Изчисляване на skip за пагинация
        const skip = (page - 1) * pageSize;
        
        const supabase = createAdminClient();
        
        // Build Supabase query
        let query = supabase
          .from("Invoice")
          .select(`
            *,
            client:Client(id, name, email),
            company:Company(id, name),
            items:InvoiceItem(*)
          `, { count: 'exact' })
          .eq("userId", session.user.id);
        
        // Apply filters
        if (params.status) {
          query = query.eq("status", params.status);
        }
        
        if (params.clientId) {
          query = query.eq("clientId", params.clientId);
        }
        
        if (params.fromDate) {
          query = query.gte("issueDate", params.fromDate);
        }
        
        if (params.toDate) {
          query = query.lte("issueDate", params.toDate);
        }
        
        // Apply sorting
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        
        // Apply pagination
        query = query.range(skip, skip + pageSize - 1);
        
        const { data: invoices, count: totalItems, error } = await query;
        
        if (error) {
          throw error;
        }
        
        // Изчисляване на общ брой страници
        const totalPages = Math.ceil((totalItems || 0) / pageSize);
        
        // Конвертиране на Decimal стойности към числа
        const serializedInvoices: InvoiceResponse[] = (invoices || []).map((invoice: any) => ({
          ...invoice,
          subtotal: Number(invoice.subtotal || 0),
          taxAmount: Number(invoice.taxAmount || 0),
          total: Number(invoice.total || 0),
          items: (invoice.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity || 0),
            price: Number(item.unitPrice || 0), // Използваме unitPrice вместо price
            taxRate: Number(item.taxRate || 0),
            total: Number(item.total || 0),
          })),
        }));
        
        // Връщане на форматиран отговор
        return NextResponse.json(
          formatApiResponse(serializedInvoices, true, {
            page,
            pageSize,
            totalPages,
            totalItems,
          })
        );
      })
    )
  );
}

// Обработка на POST заявка
export async function POST(request: NextRequest) {
  return withRateLimit(request, () => 
    withErrorHandling(request, () =>
      withAuthorization(request, async () => {
        // Сесията вече е проверена от withAuthorization middleware
        const session = await getServerSession(authOptions);
        if (!session?.user) {
          throw new Error("Неоторизиран достъп");
        }

        // Парсване на тялото на заявката
        const body = await request.json();
        
        // Използваме валидационните схеми от нашата нова библиотека
        const validatedData = invoiceSchema.parse(body);
        
        // Проверка за subscription limits - брой фактури
        const invoiceLimitCheck = await checkSubscriptionLimits(
          session.user.id as string,
          'invoices'
        );
        
        if (!invoiceLimitCheck.allowed) {
          return NextResponse.json(
            { error: invoiceLimitCheck.message || "Достигнат е лимитът за фактури за вашия план" },
            { status: 403 }
          );
        }
        
        const supabase = createAdminClient();
        
        // Get company for EIK (needed for invoice number)
        const { data: company } = await supabase
          .from("Company")
          .select("bulstatNumber")
          .eq("id", validatedData.companyId)
          .eq("userId", session.user.id)
          .single();
        
        if (!company) {
          return NextResponse.json(
            { error: "Компанията не е намерена" },
            { status: 404 }
          );
        }
        
        // Изчисляване на суми
        let subtotal = 0;
        let taxAmount = 0;
        
        const preparedItems = validatedData.items.map((item: any) => {
          const itemPrice = Number(item.price);
          const itemQuantity = Number(item.quantity);
          const itemTaxRate = item.taxRate !== undefined ? Number(item.taxRate) : 0;
          
          const lineSubtotal = itemPrice * itemQuantity;
          const lineTax = lineSubtotal * (itemTaxRate / 100);
          
          subtotal += lineSubtotal;
          taxAmount += lineTax;
          
          return {
            id: cuid(),
            description: item.description,
            quantity: itemQuantity,
            unitPrice: itemPrice,
            taxRate: itemTaxRate,
            subtotal: lineSubtotal,
            taxAmount: lineTax,
            total: lineSubtotal + lineTax,
            productId: item.productId || null,
          };
        });
        
        const total = subtotal + taxAmount;
        const invoiceId = cuid();
        
        // Retry logic for invoice creation (handles duplicate invoice numbers)
        const maxRetries = 3;
        let invoice: any = null;
        let invoiceError: any = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            // Get next invoice number using InvoiceSequence (per-user numbering, 10-digit format)
            const { getNextInvoiceSequence } = await import("@/lib/invoice-sequence");
            const { invoiceNumber, sequence } = await getNextInvoiceSequence(
              session.user.id as string
            );
            
            // Check if invoice number already exists for this user (race condition check)
            const { data: existingInvoice } = await supabase
              .from("Invoice")
              .select("id")
              .eq("invoiceNumber", invoiceNumber)
              .eq("userId", session.user.id)
              .single();
            
            if (existingInvoice) {
              // Invoice number already exists, retry with new number
              if (attempt < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                continue;
              }
              throw new Error("Неуспешно генериране на уникален номер на фактура след повторни опити");
            }
            
            // Създаване на фактура в базата данни
            const invoiceData = {
              id: invoiceId,
              invoiceNumber,
              clientId: validatedData.clientId,
              companyId: validatedData.companyId,
              userId: session.user.id,
              issueDate: new Date(validatedData.issueDate).toISOString(),
              dueDate: new Date(validatedData.dueDate).toISOString(),
              status: "DRAFT", // Always DRAFT when created
              subtotal: subtotal.toString(),
              taxAmount: taxAmount.toString(),
              total: total.toString(),
              notes: validatedData.notes || null,
              termsAndConditions: validatedData.termsAndConditions || null,
              currency: validatedData.currency || "EUR",
              locale: validatedData.locale || "bg",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            const { data: insertedInvoice, error: insertError } = await supabase
              .from("Invoice")
              .insert(invoiceData)
              .select()
              .single();
            
            if (insertError) {
              // Check if it's a duplicate key error
              if (insertError.code === '23505' && attempt < maxRetries - 1) {
                // Duplicate invoice number, retry
                await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
                continue;
              }
              throw insertError;
            }
            
            invoice = insertedInvoice;
            invoiceError = null;
            break; // Success, exit retry loop
          } catch (error: any) {
            invoiceError = error;
            if (attempt === maxRetries - 1) {
              // Last attempt, throw error
              throw error;
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          }
        }
        
        if (invoiceError || !invoice) {
          throw invoiceError || new Error("Неуспешно създаване на фактура след повторни опити");
        }
        
        // Create invoice items
        const itemsData = preparedItems.map(item => ({
          id: item.id,
          invoiceId: invoiceId,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          taxRate: item.taxRate.toString(),
          subtotal: item.subtotal.toString(),
          taxAmount: item.taxAmount.toString(),
          total: item.total.toString(),
        }));
        
        const { error: itemsError } = await supabase
          .from("InvoiceItem")
          .insert(itemsData);
        
        if (itemsError) {
          throw itemsError;
        }
        
        // Get full invoice with relations
        const { data: fullInvoice } = await supabase
          .from("Invoice")
          .select(`
            *,
            client:Client(*),
            company:Company(*),
            items:InvoiceItem(*)
          `)
          .eq("id", invoiceId)
          .single();
        
        // Log audit action
        const { logAction } = await import("@/lib/audit-log");
        const headers = request.headers;
        await logAction({
          userId: session.user.id as string,
          action: 'CREATE',
          entityType: 'INVOICE',
          entityId: invoiceId,
          invoiceId: invoiceId,
          ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
          userAgent: headers.get('user-agent') || undefined,
        });
        
        // Връщане на форматиран отговор
        return NextResponse.json(
          formatApiResponse(fullInvoice), 
          { status: ApiStatusCode.CREATED }
        );
      })
    )
  );
}
