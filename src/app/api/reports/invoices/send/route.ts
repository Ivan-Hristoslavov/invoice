import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { getInvoiceReportRows } from "@/lib/invoice-reports";
import { generateInvoiceReportPdfBuffer } from "@/lib/invoice-reports-pdf";
import { sendInvoiceReportEmail } from "@/lib/email";

const sendSchema = z.object({
  to: z.string().email("Невалиден email"),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  clientId: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  accountType: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
  }

  const body = sendSchema.parse(await request.json());
  const rows = await getInvoiceReportRows({
    userId: sessionUser.id,
    fromDate: body.fromDate ?? null,
    toDate: body.toDate ?? null,
    clientId: body.clientId ?? null,
    status: body.status ?? null,
    paymentMethod: body.paymentMethod ?? null,
    accountType: body.accountType ?? null,
  });

  const periodLabel = `${body.fromDate || "начало"} - ${body.toDate || "край"}`;
  const pdfBuffer = generateInvoiceReportPdfBuffer({
    title: "Справка за фактури",
    periodLabel: `Период: ${periodLabel}`,
    rows: rows.map((row) => ({
      ...row,
      issueDate: row.issueDate,
      total: Number(row.total || 0),
      client: Array.isArray(row.client) ? row.client[0] ?? null : row.client ?? null,
    })),
  });

  await sendInvoiceReportEmail({
    to: body.to,
    periodLabel,
    pdfBuffer,
    pdfFilename: `invoice-report-${Date.now()}.pdf`,
  });

  return NextResponse.json({ success: true });
}
