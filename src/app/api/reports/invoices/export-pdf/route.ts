import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { getInvoiceReportRows } from "@/lib/invoice-reports";
import { generateInvoiceReportPdfBuffer } from "@/lib/invoice-reports-pdf";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  }
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const rows = await getInvoiceReportRows({
    userId: sessionUser.id,
    fromDate,
    toDate,
    clientId: searchParams.get("clientId"),
    status: searchParams.get("status"),
    paymentMethod: searchParams.get("paymentMethod"),
    accountType: searchParams.get("accountType"),
  });

  const periodLabel = `Период: ${fromDate || "начало"} - ${toDate || "край"}`;
  const buffer = generateInvoiceReportPdfBuffer({
    title: "Справка за фактури",
    periodLabel,
    rows: rows.map((row) => ({
      ...row,
      issueDate: row.issueDate,
      total: Number(row.total || 0),
      client: Array.isArray(row.client) ? row.client[0] ?? null : row.client ?? null,
    })),
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-report-${Date.now()}.pdf"`,
    },
  });
}
