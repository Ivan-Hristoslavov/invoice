import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { generateInvoicePdfServer } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const proformaId = searchParams.get("proformaId");
    const disposition = searchParams.get("disposition") === "inline" ? "inline" : "attachment";
    if (!proformaId) return NextResponse.json({ error: "Липсва ID на проформата" }, { status: 400 });

    const supabase = createAdminClient();
    const { data: proforma } = await supabase
      .from("ProformaInvoice")
      .select("*")
      .eq("id", proformaId)
      .eq("userId", sessionUser.id)
      .single();
    if (!proforma) return NextResponse.json({ error: "Проформата не е намерена" }, { status: 404 });

    const [{ data: client }, { data: company }, { data: items }] = await Promise.all([
      supabase.from("Client").select("*").eq("id", proforma.clientId).single(),
      supabase.from("Company").select("*").eq("id", proforma.companyId).single(),
      supabase.from("ProformaInvoiceItem").select("*").eq("proformaInvoiceId", proformaId),
    ]);

    const snapshotProforma = withDocumentSnapshots(proforma, company || null, client || null, items || []);
    const pdfInput = {
      ...snapshotProforma,
      invoiceNumber: proforma.proformaNumber,
      issueDate: proforma.issueDate,
      dueDate: proforma.dueDate || proforma.issueDate,
      isOriginal: true,
      status: proforma.status || "DRAFT",
      documentTitle: "ПРОФОРМА ФАКТУРА",
    };
    const pdfBuffer = await generateInvoicePdfServer(pdfInput);
    const safeNumber = (proforma.proformaNumber || proformaId).replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `Proforma-${safeNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Грешка при експорт на проформа в PDF:", error);
    return NextResponse.json({ error: "Неуспешен експорт на проформа в PDF" }, { status: 500 });
  }
}
