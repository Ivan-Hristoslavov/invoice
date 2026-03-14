import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { sendInvoiceEmail } from "@/lib/email";
import { logAction } from "@/lib/audit-log";
import { resolveSessionUser } from "@/lib/session-user";
import {
  getDatabaseStatusForAppStatus,
  isIssuedLikeStatus,
  normalizeInvoiceStatus,
} from "@/lib/invoice-status";

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

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Потребителят не е намерен" },
        { status: 404 }
      );
    }
    
    const emailLimitCheck = await checkSubscriptionLimits(
      sessionUser.id,
      'emailSending'
    );
    
    if (!emailLimitCheck.allowed) {
      return NextResponse.json(
        { error: emailLimitCheck.message || "Изпращането по имейл не е налично за вашия план" },
        { status: 403 }
      );
    }

    await request.json().catch(() => null);
    const { id } = await params;

    const supabase = createAdminClient();
    
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(*)
      `)
      .eq("id", id)
      .eq("userId", sessionUser.id)
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

    const invoiceStatus = normalizeInvoiceStatus(invoice.status);
    if (invoiceStatus === "VOIDED" || invoiceStatus === "CANCELLED") {
      return NextResponse.json(
        { error: "Не можете да изпращате анулирани или отменени фактури" },
        { status: 400 }
      );
    }

    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceNumber: invoice.invoiceNumber,
      type: 'invoice_only',
      userId: sessionUser.id,
    });

    if (!isIssuedLikeStatus(invoice.status)) {
      const { error: updateError } = await supabase
        .from("Invoice")
        .update({ 
          status: getDatabaseStatusForAppStatus("ISSUED", invoice.status),
          updatedAt: new Date().toISOString()
        })
        .eq("id", id)
        .eq("userId", sessionUser.id);

      if (updateError) {
        throw updateError;
      }
    }
    
    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
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
