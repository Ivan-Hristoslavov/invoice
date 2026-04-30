import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { getInvoiceReportRows } from "@/lib/invoice-reports";

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
  const rows = await getInvoiceReportRows({
    userId: sessionUser.id,
    fromDate: searchParams.get("fromDate"),
    toDate: searchParams.get("toDate"),
    clientId: searchParams.get("clientId"),
    status: searchParams.get("status"),
    paymentMethod: searchParams.get("paymentMethod"),
    accountType: searchParams.get("accountType"),
  });

  return NextResponse.json({ rows });
}
