import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { format } from "date-fns";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    
    // Check subscription limits - експорт
    const exportLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'export'
    );
    
    if (!exportLimitCheck.allowed) {
      return NextResponse.json(
        { error: exportLimitCheck.message || "Експортът не е наличен за вашия план" },
        { status: 403 }
      );
    }

    // Get user ID
    const userId = session.user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const companyId = searchParams.get("companyId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = createAdminClient();
    
    // Build Supabase query
    let query = supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(id, name, email),
        company:Company(id, name),
        items:InvoiceItem(*)
      `)
      .eq("userId", session.user.id);
    
    if (companyId) {
      query = query.eq("companyId", companyId);
    }
    
    if (clientId) {
      query = query.eq("clientId", clientId);
    }
    
    if (status) {
      query = query.eq("status", status);
    }
    
    if (startDate) {
      query = query.gte("issueDate", startDate);
    }
    
    if (endDate) {
      query = query.lte("issueDate", endDate);
    }
    
    query = query.order("issueDate", { ascending: false });
    
    const { data: invoices, error } = await query;
    
    if (error) {
      throw error;
    }

    if (format === "csv") {
      // Format data for CSV export
      const csvData = invoices.map((invoice) => {
        return {
          invoiceNumber: invoice.invoiceNumber,
          client: invoice.client.name,
          clientEmail: invoice.client.email,
          company: invoice.company.name,
          status: invoice.status,
          issueDate: formatDate(invoice.issueDate),
          dueDate: formatDate(invoice.dueDate),
          subtotal: invoice.subtotal.toString(),
          taxAmount: invoice.taxAmount.toString(),
          total: invoice.total.toString(),
          currency: invoice.currency,
          itemCount: invoice.items.length,
        };
      });

      // Convert to CSV
      const csv = Papa.unparse(csvData);

      // Return as CSV
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="invoices-export-${formatDate(new Date())}.csv"`,
        },
      });
    } else if (format === "json") {
      // Return as JSON
      return NextResponse.json({ invoices });
    } else {
      return NextResponse.json(
        { error: "Неподдържан формат за експорт" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Грешка при експорт на фактури:", error);
    return NextResponse.json(
      { error: "Неуспешен експорт на фактури" },
      { status: 500 }
    );
  }
}

// Helper function to format dates
function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
} 