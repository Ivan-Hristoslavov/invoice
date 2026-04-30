import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { getNextProformaSequence, rollbackProformaSequence } from "@/lib/invoice-sequence";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });

  const companyId = request.nextUrl.searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId е задължителен" }, { status: 400 });

  const { sequence, proformaNumber } = await getNextProformaSequence(sessionUser.id, companyId);
  await rollbackProformaSequence(sessionUser.id, companyId, sequence);

  return NextResponse.json({ proformaNumber });
}
