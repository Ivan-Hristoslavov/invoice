import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateCreditNotePdfServer } from "@/lib/credit-note-pdf";

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

    const supabase = createAdminClient();

    // Fetch credit note with all related data
    const { data: creditNote, error: creditNoteError } = await supabase
      .from("CreditNote")
      .select(`
        *,
        items:CreditNoteItem(*)
      `)
      .eq("id", id)
      .eq("userId", session.user.id)
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
      ...creditNote,
      invoice: invoiceResult.data,
      client: clientResult.data,
      company: companyResult.data,
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
