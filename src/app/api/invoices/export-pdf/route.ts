import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { generateInvoicePdfServer } from "@/lib/pdf-generator";
import { resolveSessionUser } from "@/lib/session-user";
import { withDocumentSnapshots } from "@/lib/document-snapshots";
import { canExportFormat, getSubscriptionPlan } from "@/lib/subscription-plans";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const { data: subscriptions } = await supabaseAdmin
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");
    const isCopy = searchParams.get("copy") === "true"; // If true, watermark will be "КОПИЕ"
    const disposition = searchParams.get("disposition") === "inline" ? "inline" : "attachment";

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Липсва ID на фактура" },
        { status: 400 }
      );
    }

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("Invoice")
      .select("*")
      .eq("id", invoiceId)
      .eq("userId", sessionUser.id)
      .single();

    if (invoiceError || !invoice) {
      console.error("Грешка при зареждане на фактура:", invoiceError);
      return NextResponse.json(
        { error: "Фактурата не е намерена или достъпът е отказан" },
        { status: 404 }
      );
    }

    // Fetch client
    const { data: client } = await supabaseAdmin
      .from("Client")
      .select("*")
      .eq("id", invoice.clientId)
      .single();

    // Fetch company with bank account
    const { data: company } = await supabaseAdmin
      .from("Company")
      .select("*")
      .eq("id", invoice.companyId)
      .single();

    // Fetch bank account if company exists
    let bankAccount = null;
    if (company) {
      const { data: bankData } = await supabaseAdmin
        .from("BankAccount")
        .select("*")
        .eq("companyId", company.id)
        .limit(1)
        .single();
      bankAccount = bankData;
    }

    // Fetch invoice items
    const { data: items } = await supabaseAdmin
      .from("InvoiceItem")
      .select("*")
      .eq("invoiceId", invoiceId);

    const snapshotInvoice = withDocumentSnapshots(
      invoice,
      company ? { ...company, bankAccount } : null,
      client,
      items || []
    );
    const snapshotCompany =
      snapshotInvoice.company && typeof snapshotInvoice.company === "object"
        ? {
            ...snapshotInvoice.company,
            bankAccount:
              snapshotInvoice.company.bankAccountDetails || bankAccount || null,
          }
        : null;
    const fullInvoice = {
      ...snapshotInvoice,
      company: snapshotCompany,
      isOriginal: !isCopy,
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePdfServer(fullInvoice);

    // Create safe filename (ASCII only to avoid encoding issues)
    // Use invoice number or fallback to ID, sanitize any special characters
    const invoiceNumber = (invoice.invoiceNumber || invoiceId || 'invoice').replace(/[^a-zA-Z0-9-_]/g, '_');
    const suffix = isCopy ? '-Copy' : '';
    const safeFilename = `Invoice-${invoiceNumber}${suffix}.pdf`;
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${safeFilename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Грешка при експорт на фактура в PDF:", error);
    return NextResponse.json(
      { error: "Неуспешен експорт на фактура в PDF" },
      { status: 500 }
    );
  }
}
