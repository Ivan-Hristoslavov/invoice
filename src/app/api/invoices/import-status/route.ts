import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { applyInvoiceStatusImport } from "@/lib/services/invoice-status-import";

const statusSchema = z.enum(["PAID", "UNPAID", "OVERDUE", "ISSUED"]);

const importRowSchema = z.object({
  invoiceNumber: z.string().trim().min(1, "Номерът на фактура е задължителен"),
  companyId: z.string().trim().min(1, "Фирмата е задължителна"),
  status: statusSchema,
  paidAt: z.string().datetime().optional(),
  externalRef: z.string().trim().max(120).optional(),
});

const importPayloadSchema = z.object({
  rows: z.array(importRowSchema).min(1, "Трябва да подадете поне един ред"),
  source: z.string().trim().max(80).optional().default("microinvest"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const parsed = importPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Невалидни данни", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await applyInvoiceStatusImport({
      supabase,
      userId: sessionUser.id,
      rows: parsed.data.rows,
      source: parsed.data.source,
      audit: {
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Invoice status import failed:", error);
    return NextResponse.json({ error: "Неуспешен импорт на статуси" }, { status: 500 });
  }
}
