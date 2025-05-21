import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withErrorHandling } from "@/middleware/error-handler";
import { withRateLimit } from "@/middleware/rate-limiter";
import { withAuthorization } from "@/middleware/authorization";
import { formatApiResponse, formatPaginationParams } from "@/lib/api-utils";
import { z } from "zod";
import { invoiceSchema, invoiceItemSchema } from "@/lib/validations/forms";
import { ApiStatusCode } from "@/types/api";
import { InvoiceStatus } from "@prisma/client";

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
          throw new Error("Unauthorized");
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
        
        // Заявка към базата данни за общ брой записи
        const totalItems = await prisma.invoice.count({
          where: filters,
        });
        
        // Изчисляване на общ брой страници
        const totalPages = Math.ceil(totalItems / pageSize);
        
        // Заявка към базата данни за фактури
        const invoices = await prisma.invoice.findMany({
          where: filters,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            items: true,
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: pageSize,
        });
        
        // Конвертиране на Decimal стойности към числа
        const serializedInvoices: InvoiceResponse[] = invoices.map(invoice => ({
          ...invoice,
          subtotal: Number(invoice.subtotal),
          taxAmount: Number(invoice.taxAmount),
          total: Number(invoice.total),
          items: invoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            price: Number(item.unitPrice), // Използваме unitPrice вместо price
            taxRate: Number(item.taxRate),
            total: Number(item.total),
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
          throw new Error("Unauthorized");
        }

        // Парсване на тялото на заявката
        const body = await request.json();
        
        // Използваме валидационните схеми от нашата нова библиотека
        const validatedData = invoiceSchema.parse(body);
        
        // Генериране на уникален номер на фактура
        const invoiceCount = await prisma.invoice.count({
          where: {
            userId: session.user.id,
            companyId: validatedData.companyId,
          },
        });
        
        const invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(5, '0')}`;
        
        // Изчисляване на суми
        let subtotal = 0;
        let taxAmount = 0;
        
        const preparedItems = validatedData.items.map(item => {
          const itemPrice = Number(item.price);
          const itemQuantity = Number(item.quantity);
          const itemTaxRate = item.taxRate !== undefined ? Number(item.taxRate) : 0;
          
          const lineSubtotal = itemPrice * itemQuantity;
          const lineTax = lineSubtotal * (itemTaxRate / 100);
          
          subtotal += lineSubtotal;
          taxAmount += lineTax;
          
          return {
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
        
        // Създаване на фактура в базата данни
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            clientId: validatedData.clientId,
            companyId: validatedData.companyId,
            userId: session.user.id,
            issueDate: new Date(validatedData.issueDate),
            dueDate: new Date(validatedData.dueDate),
            status: validatedData.status || "DRAFT" as InvoiceStatus,
            subtotal,
            taxAmount,
            total,
            notes: validatedData.notes || null,
            termsAndConditions: validatedData.termsAndConditions || null,
            items: {
              create: preparedItems,
            },
          },
          include: {
            client: true,
            company: true,
            items: true,
          },
        });
        
        // Конвертиране на Decimal към числа за отговора
        const serializedInvoice = {
          ...invoice,
          subtotal: Number(invoice.subtotal),
          taxAmount: Number(invoice.taxAmount),
          total: Number(invoice.total),
          items: invoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            taxRate: Number(item.taxRate),
            subtotal: Number(item.subtotal),
            taxAmount: Number(item.taxAmount),
            total: Number(item.total),
          })),
        };
        
        // Връщане на форматиран отговор
        return NextResponse.json(
          formatApiResponse(serializedInvoice), 
          { status: ApiStatusCode.CREATED }
        );
      })
    )
  );
}
