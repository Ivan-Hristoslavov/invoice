import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { checkPermission } from "@/lib/permissions";
import { getAccessibleCompaniesForUser } from "@/lib/team";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { generateVatProtocol117PdfServer } from "@/lib/vat-protocol-117-pdf";
import { sendVatProtocol117Email } from "@/lib/email";
import { logAction } from "@/lib/audit-log";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const canSend = await checkPermission("invoice:send");
    if (!canSend) {
      return NextResponse.json({ error: "Нямате право да изпращате документи по имейл" }, { status: 403 });
    }

    const emailLimitCheck = await checkSubscriptionLimits(sessionUser.id, "emailSending");
    if (!emailLimitCheck.allowed) {
      return NextResponse.json(
        { error: emailLimitCheck.message || "Изпращането по имейл не е налично за вашия план" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const accessibleCompanies = await getAccessibleCompaniesForUser(sessionUser.id);
    const accessibleCompanyIds = accessibleCompanies.map((c) => c.id);

    if (accessibleCompanyIds.length === 0) {
      return NextResponse.json({ error: "Няма достъп" }, { status: 403 });
    }

    const { data: protocol, error: protocolError } = await supabase
      .from("VatProtocol117")
      .select(`
        *,
        items:VatProtocol117Item(*)
      `)
      .eq("id", id)
      .in("companyId", accessibleCompanyIds)
      .single();

    if (protocolError || !protocol) {
      return NextResponse.json({ error: "Протоколът не е намерен" }, { status: 404 });
    }

    const [clientResult, companyResult] = await Promise.all([
      supabase.from("Client").select("*").eq("id", protocol.clientId).maybeSingle(),
      supabase.from("Company").select("*").eq("id", protocol.companyId).maybeSingle(),
    ]);

    const client = clientResult.data;
    const company = companyResult.data;

    if (!client?.email?.trim()) {
      return NextResponse.json(
        { error: "Липсва имейл на контрагента (доставчик). Добавете го в картона на клиента." },
        { status: 400 }
      );
    }

    const protocolData = withDocumentSnapshots(protocol, company, client, protocol.items || []);
    const pdfBuffer = await generateVatProtocol117PdfServer(protocolData);
    const safeNum = String(protocol.protocolNumber).replace(/[^a-zA-Z0-9-]/g, "-");
    const pdfFilename = `Protokol-chl-117-${safeNum}.pdf`;

    await sendVatProtocol117Email({
      to: client.email.trim(),
      protocolNumber: protocol.protocolNumber,
      companyName: company?.name || "Фирма",
      pdfBuffer,
      pdfFilename,
    });

    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
      action: "SEND",
      entityType: "VAT_PROTOCOL_117",
      entityId: id,
      ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
      userAgent: headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending VatProtocol117 email:", error);
    return NextResponse.json({ error: "Неуспешно изпращане по имейл" }, { status: 500 });
  }
}
