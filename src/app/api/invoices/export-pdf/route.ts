import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { generateInvoicePdfServer } from "@/lib/pdf-generator";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get("invoiceId");

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch invoice with all related data
    const { data: invoice, error } = await supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(id, name, email, phone, address, city, country, bulstatNumber, vatNumber, mol),
        company:Company(id, name, email, phone, address, bulstatNumber, vatRegistrationNumber, vatRegistered, mol, bankAccount:BankAccount(*)),
        items:InvoiceItem(*)
      `)
      .eq("id", invoiceId)
      .eq("userId", session.user.id)
      .single();

    if (error || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or access denied" },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePdfServer(invoice);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Фактура-${invoice.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting invoice to PDF:", error);
    return NextResponse.json(
      { error: "Failed to export invoice to PDF" },
      { status: 500 }
    );
  }
} 