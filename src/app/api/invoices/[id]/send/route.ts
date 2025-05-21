import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendInvoiceEmail } from "@/lib/email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { type, paymentLink } = await request.json();
    const { id } = await params;

    // Get invoice with client details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (!invoice.client.email) {
      return NextResponse.json(
        { error: "Client email not found" },
        { status: 400 }
      );
    }

    // Send email using simplified function
    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      type: type as 'invoice_only' | 'invoice_with_payment',
      paymentLink,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}

export async function POST_TEST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { type, paymentLink } = await request.json();
    
    // За тестови цели използваме хардкоднати данни
    const testData = {
      to: 'hristoslavov.ivanov@gmail.com',
      invoiceNumber: '2024-001',
      type: type as 'invoice_only' | 'invoice_with_payment',
      paymentLink: paymentLink,
    };

    const result = await sendInvoiceEmail(testData);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error in invoice send route:', error);
    return NextResponse.json(
      { error: 'Failed to send invoice email' },
      { status: 500 }
    );
  }
} 