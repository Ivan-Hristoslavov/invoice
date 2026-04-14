import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateVatProtocol117PdfServer } from "@/lib/vat-protocol-117-pdf";
import { resolveSessionUser } from "@/lib/session-user";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { canExportFormat, getSubscriptionPlan } from "@/lib/subscription-plans";
import { getAccessibleCompaniesForUser } from "@/lib/team";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const disposition =
      searchParams.get("disposition") === "inline" ? "inline" : "attachment";

    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("plan, status")
      .eq("userId", sessionUser.id)
      .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
      .order("createdAt", { ascending: false })
      .limit(1);
    const plan = getSubscriptionPlan(subscriptions?.[0]?.plan);

    if (!canExportFormat(plan.features.export, "pdf")) {
      return NextResponse.json(
        { error: "PDF експортът е наличен само за PRO и BUSINESS." },
        { status: 403 }
      );
    }

    const accessibleCompanies = await getAccessibleCompaniesForUser(sessionUser.id);
    const accessibleCompanyIds = accessibleCompanies.map((c) => c.id);

    if (accessibleCompanyIds.length === 0) {
      return NextResponse.json({ error: "Няма достъп до компании" }, { status: 403 });
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
      supabase.from("Client").select("*").eq("id", protocol.clientId).single(),
      supabase.from("Company").select("*").eq("id", protocol.companyId).single(),
    ]);

    const protocolData = withDocumentSnapshots(
      protocol,
      companyResult.data,
      clientResult.data,
      protocol.items || []
    );

    const pdfBuffer = await generateVatProtocol117PdfServer(protocolData);

    const filename = `Protokol-chl-117-${protocol.protocolNumber.replace(/[^a-zA-Z0-9-]/g, "-")}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating VatProtocol117 PDF:", error);
    return NextResponse.json({ error: "Грешка при генериране на PDF" }, { status: 500 });
  }
}
