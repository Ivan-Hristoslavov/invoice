import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { sendInvoiceEmail } from "@/lib/email";
import { logAction } from "@/lib/audit-log";

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
    
    // Check subscription limits - изпращане по имейл
    const emailLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'emailSending'
    );
    
    if (!emailLimitCheck.allowed) {
      return NextResponse.json(
        { error: emailLimitCheck.message || "Изпращането по имейл не е налично за вашия план" },
        { status: 403 }
      );
    }

    const { type } = await request.json();
    const { id } = await params;

    const supabase = createAdminClient();
    
    // Get invoice with client details
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(*)
      `)
      .eq("id", id)
      .eq("userId", session.user.id)
      .single();
    
    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

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

    if (!invoice.client?.email) {
      return NextResponse.json(
        { error: "Client email not found" },
        { status: 400 }
      );
    }
    
    // Update invoice status to ISSUED when sent
    await supabase
      .from("Invoice")
      .update({ 
        status: "ISSUED",
        updatedAt: new Date().toISOString()
      })
      .eq("id", id);
    
    // Send email (без payment link - не приемаме плащания)
    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      type: 'invoice_only', // Винаги само фактура, без payment link
      userId: session.user.id,
    });
    
    // Log audit action
    const headers = request.headers;
    await logAction({
      userId: session.user.id as string,
      action: 'SEND',
      entityType: 'INVOICE',
      entityId: id,
      invoiceId: id,
      ipAddress: headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
      userAgent: headers.get('user-agent') || undefined,
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