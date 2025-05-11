import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";

const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.date(),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CREDIT_CARD", "PAYPAL", "OTHER"]),
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
        paymentDate: validated.paymentDate,
        paymentMethod: validated.paymentMethod,
        reference: validated.reference || null,
        notes: validated.notes || null,
      },
    });

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

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid payment data", details: error.errors },
        { status: 400 }
      );
    }

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

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
} 