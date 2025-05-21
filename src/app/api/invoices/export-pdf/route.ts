import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    // Check if the invoice exists and belongs to the user
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId: session.user.id,
      },
      include: {
        client: true,
        company: true,
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or access denied" },
        { status: 404 }
      );
    }

    // Return the full invoice data for PDF generation
    return NextResponse.json({
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      invoice: {
        ...invoice,
        // Convert Decimal to string for JSON serialization
        subtotal: invoice.subtotal.toString(),
        taxAmount: invoice.taxAmount.toString(),
        total: invoice.total.toString(),
        items: invoice.items.map(item => ({
          ...item,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          taxRate: item.taxRate.toString(),
          subtotal: item.subtotal.toString(),
          taxAmount: item.taxAmount.toString(),
          total: item.total.toString(),
        })),
        payments: invoice.payments.map(payment => ({
          ...payment,
          amount: payment.amount.toString(),
        })),
      }
    });
  } catch (error) {
    console.error("Error exporting invoice to PDF:", error);
    return NextResponse.json(
      { error: "Failed to export invoice to PDF" },
      { status: 500 }
    );
  }
} 