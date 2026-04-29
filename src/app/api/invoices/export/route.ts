import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Papa from "papaparse";
import { resolveSessionUser } from "@/lib/session-user";
import { getDatabaseStatusesForAppStatus } from "@/lib/invoice-status";
import {
  canExportFormat,
  getSubscriptionPlan,
  type ExportFormat,
} from "@/lib/subscription-plans";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "csv") as ExportFormat;
    const companyId = searchParams.get("companyId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const supabase = createAdminClient();
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("plan, status")
      .eq("userId", sessionUser.id)
      .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
      .order("createdAt", { ascending: false })
      .limit(1);
    const plan = getSubscriptionPlan(subscriptions?.[0]?.plan);

    if (!["csv", "json"].includes(format)) {
      return NextResponse.json(
        { error: "Неподдържан формат за експорт" },
        { status: 400 }
      );
    }

    if (!canExportFormat(plan.features.export, format)) {
      const errorMessage =
        format === "csv"
          ? "CSV експортът не е наличен за вашия план."
          : "JSON експортът е наличен само за PRO и BUSINESS.";
      return NextResponse.json(
        { error: errorMessage },
        { status: 403 }
      );
    }
    
    // Build Supabase query
    let query = supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(id, name, email),
        company:Company(id, name),
        items:InvoiceItem(*)
      `)
      .eq("userId", sessionUser.id);
    
    if (companyId) {
      query = query.eq("companyId", companyId);
    }
    
    if (clientId) {
      query = query.eq("clientId", clientId);
    }
    
    if (status) {
      const matchingStatuses = getDatabaseStatusesForAppStatus(status);
      query =
        matchingStatuses.length > 1
          ? query.in("status", matchingStatuses)
          : query.eq("status", matchingStatuses[0]);
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
    } else {
      const filename = `invoices-export-${formatDate(new Date())}.json`;
      return new NextResponse(JSON.stringify({ invoices }, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
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