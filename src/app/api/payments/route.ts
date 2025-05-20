import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Decimal } from '@prisma/client/runtime/library';

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

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const json = await request.json();
    console.log("Received payment data:", JSON.stringify(json));
    
    try {
      const validated = paymentSchema.parse(json);
      
      // Verify invoice exists and belongs to user
      const invoice = await prisma.invoice.findUnique({
        where: {
          id: validated.invoiceId,
          userId: session.user.id,
        },
      });

      if (!invoice) {
        return NextResponse.json(
          { error: "Invoice not found or doesn't belong to user" },
          { status: 404 }
        );
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          invoiceId: validated.invoiceId,
          amount: validated.amount,
          paymentDate: new Date(validated.paymentDate),
          paymentMethod: validated.paymentMethod,
          reference: validated.reference || null,
          notes: validated.notes || null,
        },
        include: {
          invoice: {
            include: {
              client: true,
            },
          },
        },
      });

      // Serialize the response to handle Decimal objects
      const serializedPayment = serializeDecimal(payment);

      // Check if invoice is fully paid
      const totalPayments = await prisma.payment.aggregate({
        where: {
          invoiceId: validated.invoiceId,
        },
        _sum: {
          amount: true,
        },
      });

      const totalPaid = totalPayments._sum.amount || 0;

      // Update invoice status if payment covers the total
      if (totalPaid >= Number(invoice.total)) {
        await prisma.invoice.update({
          where: {
            id: validated.invoiceId,
          },
          data: {
            status: "PAID",
          },
        });
      } else if (invoice.status === "DRAFT" || invoice.status === "OVERDUE") {
        // If invoice was draft or overdue, update to unpaid
        await prisma.invoice.update({
          where: {
            id: validated.invoiceId,
          },
          data: {
            status: "UNPAID",
          },
        });
      }

      return NextResponse.json(serializedPayment, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("Validation error:", validationError.errors);
        return NextResponse.json(
          { error: "Invalid payment data", details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const invoiceId = searchParams.get("invoiceId");

    const payments = await prisma.payment.findMany({
      where: {
        invoice: {
          userId: session.user.id,
        },
        invoiceId: invoiceId || undefined,
      },
      include: {
        invoice: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
    });

    // Serialize the response to handle Decimal objects
    const serializedPayments = serializeDecimal(payments);

    return NextResponse.json(serializedPayments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
} 