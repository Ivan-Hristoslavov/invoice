import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { sendDebitNoteEmail } from "@/lib/email";
import { logAction } from "@/lib/audit-log";
import { resolveSessionUser } from "@/lib/session-user";
import { generateDebitNotePdfServer } from "@/lib/debit-note-pdf";
import { withDocumentSnapshots } from "@/lib/document-snapshots";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      "emailSending"
    );

    if (!emailLimitCheck.allowed) {
      return NextResponse.json(
        {
          error:
            emailLimitCheck.message ||
            "Изпращането по имейл не е налично за вашия план",
        },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: debitNote, error: debitNoteError } = await supabase
      .from("DebitNote")
      .select(
        `
        *,
        items:DebitNoteItem(*)
      `
      )
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (debitNoteError || !debitNote) {
      return NextResponse.json(
        { error: "Дебитното известие не е намерено" },
        { status: 404 }
      );
    }

    const [invoiceResult, clientResult, companyResult] = await Promise.all([
      debitNote.invoiceId
        ? supabase
            .from("Invoice")
            .select("id, invoiceNumber, issueDate")
            .eq("id", debitNote.invoiceId)
            .eq("userId", sessionUser.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      debitNote.clientId
        ? supabase
            .from("Client")
            .select("*")
            .eq("id", debitNote.clientId)
            .eq("userId", sessionUser.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      debitNote.companyId
        ? supabase
            .from("Company")
            .select("*")
            .eq("id", debitNote.companyId)
            .eq("userId", sessionUser.id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const invoice = invoiceResult.data;
    const client = clientResult.data;
    const company = companyResult.data;

    if (!client?.email) {
      return NextResponse.json(
        { error: "Липсва имейл на клиента" },
        { status: 400 }
      );
    }

    const debitNoteData = {
      ...withDocumentSnapshots(
        debitNote,
        company,
        client,
        debitNote.items || []
      ),
      invoice,
    };

    const pdfBuffer = await generateDebitNotePdfServer(debitNoteData);

    const safeNumber = String(debitNote.debitNoteNumber).replace(
      /[^a-zA-Z0-9-]/g,
      "-"
    );
    const pdfFilename = `Debitno-Izvestie-${safeNumber}.pdf`;

    await sendDebitNoteEmail({
      to: client.email,
      debitNoteNumber: debitNote.debitNoteNumber,
      invoiceNumber: invoice?.invoiceNumber ?? null,
      companyName: company?.name ?? "",
      pdfBuffer,
      pdfFilename,
    });

    const headers = request.headers;
    await logAction({
      userId: sessionUser.id,
      action: "SEND",
      entityType: "DEBIT_NOTE",
      entityId: id,
      invoiceId: debitNote.invoiceId ?? undefined,
      ipAddress:
        headers.get("x-forwarded-for") ||
        headers.get("x-real-ip") ||
        undefined,
      userAgent: headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending debit note:", error);
    return NextResponse.json(
      { error: "Неуспешно изпращане на дебитното известие" },
      { status: 500 }
    );
  }
}
