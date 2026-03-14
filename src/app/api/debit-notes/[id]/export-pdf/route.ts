import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateDebitNotePdfServer } from "@/lib/debit-note-pdf";
import { resolveSessionUser } from "@/lib/session-user";
import { withDocumentSnapshots } from "@/lib/document-snapshots";

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

    // Fetch debit note with all related data
    const { data: debitNote, error: debitNoteError } = await supabase
      .from("DebitNote")
      .select(`
        *,
        items:DebitNoteItem(*)
      `)
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (debitNoteError || !debitNote) {
      return NextResponse.json({ error: "Дебитното известие не е намерено" }, { status: 404 });
    }

    // Fetch related data
    const [invoiceResult, clientResult, companyResult] = await Promise.all([
      debitNote.invoiceId
        ? supabase.from("Invoice").select("*").eq("id", debitNote.invoiceId).single()
        : Promise.resolve({ data: null, error: null }),
      supabase.from("Client").select("*").eq("id", debitNote.clientId).single(),
      supabase.from("Company").select("*").eq("id", debitNote.companyId).single(),
    ]);

    const debitNoteData = {
      ...withDocumentSnapshots(
        debitNote,
        companyResult.data,
        clientResult.data,
        debitNote.items || []
      ),
      invoice: invoiceResult.data,
    };

    // Generate PDF
    const pdfBuffer = await generateDebitNotePdfServer(debitNoteData);

    // Create filename
    const filename = `Debitno-Izvestie-${debitNote.debitNoteNumber.replace(/[^a-zA-Z0-9-]/g, '-')}.pdf`;

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
    console.error("Error generating debit note PDF:", error);
    return NextResponse.json(
      { error: "Грешка при генериране на PDF" },
      { status: 500 }
    );
  }
}
