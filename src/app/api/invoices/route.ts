import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import { createAdminClient } from "@/lib/supabase/server";
import { withErrorHandling } from "@/middleware/error-handler";
import { withRateLimit } from "@/middleware/rate-limiter";
import { withAuthorization } from "@/middleware/authorization";
import { formatApiResponse, formatPaginationParams } from "@/lib/api-utils";
import {
  createDocumentSnapshots,
  fetchOwnedCompanyAndClient,
  fetchProductsByIds,
  prepareDocumentItems,
} from "@/lib/invoice-documents";
import { z } from "zod";
import { invoiceSchema, invoiceItemSchema } from "@/lib/validations/forms";
import { createGoodsRecipientSnapshot } from "@/lib/document-snapshots";
import { ApiStatusCode } from "@/types/api";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import cuid from "cuid";
import { resolveSessionUser } from "@/lib/session-user";
import {
  getDatabaseStatusesForAppStatus,
  normalizeInvoiceStatus,
} from "@/lib/invoice-status";
import { getAccessibleCompaniesForUser } from "@/lib/team";

function normalizeInvoiceMutationError(error: unknown): Error {
  const fallbackMessage = "Неуспешно създаване на фактура. Моля, опитайте отново.";
  if (error instanceof Error) return error;

  const maybeError = error as
    | { message?: string; code?: string; details?: string | null }
    | undefined;
  const message = maybeError?.message || fallbackMessage;
  const normalized = new Error(message);

  if (maybeError?.code === "23505") {
    normalized.name = "ValidationError";
  } else if (maybeError?.code === "23503") {
    normalized.name = "ValidationError";
    normalized.message =
      "Невалидни данни за фактурата (липсващ клиент, фирма или артикул).";
  }

  return normalized;
}

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
        const sessionUser = await resolveSessionUser(session.user);
        if (!sessionUser) {
          throw new Error("Потребителят не е намерен");
        }

        // Извличане на параметрите от заявката
        const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());
        const params = InvoiceQuerySchema.parse(searchParams);
        
        // Форматиране на параметрите за пагинация
        const { page, pageSize, sortBy, sortOrder } = formatPaginationParams(params);
        
        // Конструиране на филтри
        const filters: any = {
          userId: sessionUser.id,
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
        const accessibleCompanies = await getAccessibleCompaniesForUser(sessionUser.id);
        const accessibleCompanyIds = accessibleCompanies.map((company) => company.id);

        if (accessibleCompanyIds.length === 0) {
          return NextResponse.json(
            formatApiResponse([], true, {
              page,
              pageSize,
              totalPages: 0,
              totalItems: 0,
            })
          );
        }

        let query = supabase
          .from("Invoice")
          .select(`
            *,
            client:Client(id, name, email),
            company:Company(id, name),
            items:InvoiceItem(*)
          `, { count: 'exact' })
          .in("companyId", accessibleCompanyIds);
        
        // Apply filters
        if (params.status) {
          const matchingStatuses = getDatabaseStatusesForAppStatus(params.status);
          query =
            matchingStatuses.length > 1
              ? query.in("status", matchingStatuses)
              : query.eq("status", matchingStatuses[0]);
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
          status: normalizeInvoiceStatus(invoice.status),
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
        const sessionUser = await resolveSessionUser(session.user);
        if (!sessionUser) {
          throw new Error("Потребителят не е намерен");
        }

        // Парсване на тялото на заявката
        const body = await request.json();
        
        // Използваме валидационните схеми от нашата нова библиотека
        const validatedData = invoiceSchema.parse(body);
        
        // Проверка за subscription limits - брой фактури
        const invoiceLimitCheck = await checkSubscriptionLimits(
          sessionUser.id,
          'invoices'
        );
        
        if (!invoiceLimitCheck.allowed) {
          return NextResponse.json(
            { error: invoiceLimitCheck.message || "Достигнат е лимитът за фактури за вашия план" },
            { status: 403 }
          );
        }
        
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
        
        const productIds = validatedData.items
          .map((item) => item.productId)
          .filter((productId): productId is string => Boolean(productId));
        const productById = await fetchProductsByIds(
          supabase,
          sessionUser.id,
          productIds
        );
        const preparedInputItems = validatedData.items.map((item: any) => ({
          ...item,
          id: cuid(),
        }));
        const { preparedItems, subtotal, taxAmount, total } =
          prepareDocumentItems(preparedInputItems, productById);
        const normalizedSupplyType =
          company.vatRegistered === false
            ? "NOT_VAT_REGISTERED"
            : validatedData.supplyType || "DOMESTIC";

        // Retry logic for invoice creation (handles duplicate invoice numbers)
        const maxRetries = 3;
        let invoice: any = null;
        let invoiceError: any = null;
        let createdInvoiceId: string | null = null;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          // Track the sequence we issued in this iteration so we can roll it
          // back if the Invoice INSERT fails, avoiding gaps in the series.
          let currentIssuedSequence: number | null = null;
          try {
            const invoiceId = cuid();
            // Get next invoice number using InvoiceSequence (per-user numbering, 10-digit format)
            const { getNextInvoiceSequence, rollbackInvoiceSequence } = await import(
              "@/lib/invoice-sequence"
            );
            const { invoiceNumber, sequence } = await getNextInvoiceSequence(
              company.userId,
              validatedData.companyId,
              company.bulstatNumber
            );
            currentIssuedSequence = sequence;
            void rollbackInvoiceSequence; // keep lazy import reachable for catch
            
            // Check if invoice number already exists for this user (race condition check)
            const { data: existingInvoice, error: existingInvoiceLookupError } = await supabase
              .from("Invoice")
              .select("id")
              .eq("invoiceNumber", invoiceNumber)
              .eq("userId", company.userId)
              .single();
            const notFoundCode =
              existingInvoiceLookupError &&
              (existingInvoiceLookupError.code === "PGRST116" ||
                existingInvoiceLookupError.code === "406");
            if (existingInvoiceLookupError && !notFoundCode) {
              throw existingInvoiceLookupError;
            }
            
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
              userId: company.userId,
              issueDate: new Date(validatedData.issueDate).toISOString(),
              dueDate: new Date(validatedData.dueDate).toISOString(),
              supplyDate: validatedData.supplyDate ? new Date(validatedData.supplyDate).toISOString() : new Date(validatedData.issueDate).toISOString(),
              status: "DRAFT", // Always DRAFT when created
              subtotal: subtotal.toString(),
              taxAmount: taxAmount.toString(),
              total: total.toString(),
              notes: validatedData.notes || null,
              termsAndConditions: validatedData.termsAndConditions || null,
              currency: validatedData.currency || "EUR",
              locale: validatedData.locale || "bg",
              placeOfIssue: validatedData.placeOfIssue || "София",
              paymentMethod:
                validatedData.paymentMethod === "CARD"
                  ? "CREDIT_CARD"
                  : validatedData.paymentMethod || "BANK_TRANSFER",
              isEInvoice: validatedData.isEInvoice || false,
              isOriginal: validatedData.isOriginal !== false,
              supplyType: normalizedSupplyType,
              bulstatNumber: company.bulstatNumber || null,
              createdById: sessionUser.id,
              ...createDocumentSnapshots(
                company,
                client,
                preparedItems,
                productById
              ),
              goodsRecipientSnapshot: createGoodsRecipientSnapshot(
                validatedData.goodsRecipient ?? null
              ),
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
            createdInvoiceId = invoiceId;
            invoiceError = null;
            break; // Success, exit retry loop
          } catch (error: any) {
            invoiceError = normalizeInvoiceMutationError(error);
            if (currentIssuedSequence !== null) {
              try {
                const { rollbackInvoiceSequence } = await import(
                  "@/lib/invoice-sequence"
                );
                await rollbackInvoiceSequence(
                  company.userId,
                  validatedData.companyId,
                  currentIssuedSequence
                );
              } catch (rollbackError) {
                console.error(
                  "Failed to roll back invoice sequence after INSERT error:",
                  rollbackError
                );
              }
            }
            if (attempt === maxRetries - 1) {
              // Last attempt, throw error
              throw normalizeInvoiceMutationError(error);
            }
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          }
        }
        
        if (invoiceError || !invoice) {
          throw invoiceError || new Error("Неуспешно създаване на фактура след повторни опити");
        }
        
        // Create invoice items
        if (!createdInvoiceId) {
          throw new Error("Липсва идентификатор на фактурата след създаване.");
        }

        const itemsData = preparedItems.map(item => ({
          id: item.id,
          invoiceId: createdInvoiceId,
          productId: item.productId,
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
          .from("InvoiceItem")
          .insert(itemsData);

        if (itemsError) {
          await supabase
            .from("Invoice")
            .delete()
            .eq("id", createdInvoiceId)
            .eq("userId", company.userId);
          try {
            const parsed = parseBulgarianInvoiceNumber(invoice.invoiceNumber as string);
            if (parsed?.sequentialNumber != null) {
              const { rollbackInvoiceSequence } = await import(
                "@/lib/invoice-sequence"
              );
              await rollbackInvoiceSequence(
                company.userId,
                validatedData.companyId,
                parsed.sequentialNumber
              );
            }
          } catch (rollbackError) {
            console.error(
              "Failed to roll back invoice sequence after items insert error:",
              rollbackError
            );
          }
          throw normalizeInvoiceMutationError(itemsError);
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
          .eq("id", createdInvoiceId)
          .single();
        
        // Log audit action
        const { logAction } = await import("@/lib/audit-log");
        const headers = request.headers;
        await logAction({
          userId: sessionUser.id,
          action: 'CREATE',
          entityType: 'INVOICE',
          entityId: createdInvoiceId,
          invoiceId: createdInvoiceId,
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
