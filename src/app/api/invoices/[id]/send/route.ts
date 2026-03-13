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
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }
    
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
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    if (!invoice.client?.email) {
      return NextResponse.json(
        { error: "Липсва имейл на клиента" },
        { status: 400 }
      );
    }
    
    await supabase
      .from("Invoice")
      .update({ 
        status: "ISSUED",
        updatedAt: new Date().toISOString()
      })
      .eq("id", id);
    
    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      type: 'invoice_only',
      userId: session.user.id,
    });
    
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
      { error: "Неуспешно изпращане на фактура" },
      { status: 500 }
    );
  }
}
