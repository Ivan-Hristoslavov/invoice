import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateCreditNotePdfServer } from "@/lib/credit-note-pdf";
import { resolveSessionUser } from "@/lib/session-user";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { canExportFormat, getSubscriptionPlan } from "@/lib/subscription-plans";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Fetch credit note with all related data
    const { data: creditNote, error: creditNoteError } = await supabase
      .from("CreditNote")
      .select(`
        *,
        items:CreditNoteItem(*)
      `)
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (creditNoteError || !creditNote) {
      return NextResponse.json({ error: "Кредитното известие не е намерено" }, { status: 404 });
    }

    // Fetch related data
    const [invoiceResult, clientResult, companyResult] = await Promise.all([
      supabase.from("Invoice").select("*").eq("id", creditNote.invoiceId).single(),
      supabase.from("Client").select("*").eq("id", creditNote.clientId).single(),
      supabase.from("Company").select("*").eq("id", creditNote.companyId).single(),
    ]);

    const creditNoteData = {
      ...withDocumentSnapshots(
        creditNote,
        companyResult.data,
        clientResult.data,
        creditNote.items || []
      ),
      invoice: invoiceResult.data,
    };

    // Generate PDF
    const pdfBuffer = await generateCreditNotePdfServer(creditNoteData);

    // Create filename
    const filename = `Kreditno-Izvestie-${creditNote.creditNoteNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;

    // Return PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating credit note PDF:", error);
    return NextResponse.json(
      { error: "Грешка при генериране на PDF" },
      { status: 500 }
    );
  }
}
