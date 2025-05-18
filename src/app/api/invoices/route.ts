import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

// Schema for invoice validation
const invoiceItemSchema = z.object({
  id: z.number(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  taxRate: z.number().min(0, "Tax rate cannot be negative"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  companyId: z.string().min(1, "Company is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const clientId = searchParams.get("client") || undefined;
    const status = searchParams.get("status") || undefined;
    
    // Build the search filter
    const whereClause: any = {
      userId: session.user.id,
    };
    
    if (clientId) {
      whereClause.clientId = clientId;
    }
    
    if (status) {
      // Handle multiple statuses separated by commas
      const statusValues = status.split(',');
      
      // Validate that all statuses are valid InvoiceStatus enum values
      const validStatuses = statusValues.filter(s => 
        ['DRAFT', 'UNPAID', 'PAID', 'OVERDUE', 'CANCELLED'].includes(s)
      );
      
      if (validStatuses.length > 0) {
        whereClause.status = {
          in: validStatuses
        };
      }
    }
    
    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query, mode: "insensitive" } },
        { client: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate the data
    const json = await request.json();
    const validatedData = invoiceSchema.parse(json);
    
    // Calculate totals
    const items = validatedData.items.map(item => {
      const subtotal = item.quantity * item.unitPrice;
      const taxAmount = subtotal * (item.taxRate / 100);
      const total = subtotal + taxAmount;
      
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal,
        taxAmount,
        total
      };
    });
    
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal + taxAmount;
    
    // Create the invoice with its items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: validatedData.invoiceNumber,
        clientId: validatedData.clientId,
        companyId: validatedData.companyId,
        userId: session.user.id,
        issueDate: new Date(validatedData.issueDate),
        dueDate: new Date(validatedData.dueDate),
        status: "DRAFT", // Default status for new invoices
        subtotal,
        taxAmount,
        total,
        currency: validatedData.currency,
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal: item.subtotal,
            taxAmount: item.taxAmount,
            total: item.total
          }))
        }
      },
      include: {
        items: true,
        client: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    
    // Return validation errors if present
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
} 