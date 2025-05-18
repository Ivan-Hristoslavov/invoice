import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Build the query
    const query: any = {
      userId: session.user.id,
    };

    if (companyId) {
      query.companyId = companyId;
    }

    if (clientId) {
      query.clientId = clientId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.issueDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      query.issueDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      query.issueDate = {
        lte: new Date(endDate),
      };
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where: query,
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        issueDate: "desc",
      },
    });

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
        { error: "Unsupported export format" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error exporting invoices:", error);
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    );
  }
}

// Helper function to format dates
function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
} 