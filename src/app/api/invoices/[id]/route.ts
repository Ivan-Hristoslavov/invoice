import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import { Decimal } from '@prisma/client/runtime/library';
import { z } from "zod";

// Helper function to serialize Prisma Decimal objects
function serializeDecimal(value: any): any {
  if (value instanceof Decimal) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDecimal);
  }
  if (typeof value === 'object' && value !== null) {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDecimal(val);
    }
    return result;
  }
  return value;
}

// Schema for invoice update validation
const invoiceItemSchema = z.object({
  id: z.number(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  taxRate: z.number().min(0, "Tax rate cannot be negative"),
});

const invoiceUpdateSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  clientId: z.string().min(1, "Client is required"),
  companyId: z.string().min(1, "Company is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  currency: z.string().min(1, "Currency is required"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            country: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: true,
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    return Response.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return Response.json(
      { error: "Error fetching invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!invoice) {
      return Response.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return Response.json(
        { error: "Cannot edit paid invoice" },
        { status: 400 }
      );
    }

    const data = await request.json();

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: params.id,
      },
      data: {
        clientId: data.clientId,
        companyId: data.companyId,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        currency: data.currency,
        notes: data.notes,
        termsAndConditions: data.termsAndConditions,
      },
    });

    // Delete existing items
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId: params.id,
      },
    });

    // Create new items
    const items = data.items.map((item: any) => ({
      invoiceId: params.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      subtotal: item.quantity * item.unitPrice,
      taxAmount: (item.quantity * item.unitPrice * item.taxRate) / 100,
      total: item.quantity * item.unitPrice * (1 + item.taxRate / 100),
    }));

    await prisma.invoiceItem.createMany({
      data: items,
    });

    // Recalculate invoice totals
    const totals = items.reduce(
      (acc: any, item: any) => {
        acc.subtotal += item.subtotal;
        acc.taxAmount += item.taxAmount;
        acc.total += item.total;
        return acc;
      },
      { subtotal: 0, taxAmount: 0, total: 0 }
    );

    // Update invoice totals
    await prisma.invoice.update({
      where: {
        id: params.id,
      },
      data: {
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        total: totals.total,
      },
    });

    revalidatePath(`/invoices/${params.id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return Response.json(updatedInvoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return Response.json(
      { error: "Error updating invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const invoiceId = context.params.id;
    
    // Check if invoice exists and belongs to user
    const existingInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }
    
    // Delete related payments first
    await prisma.payment.deleteMany({
      where: {
        invoiceId,
      },
    });
    
    // Delete related invoice items
    await prisma.invoiceItem.deleteMany({
      where: {
        invoiceId,
      },
    });
    
    // Delete related documents
    await prisma.document.deleteMany({
      where: {
        invoiceId,
      },
    });
    
    // Delete the invoice
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
} 