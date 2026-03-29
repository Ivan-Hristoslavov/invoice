import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";

type CompanyEmbed = { id: string; name: string };

function companyNameFromJoin(
  company: CompanyEmbed | CompanyEmbed[] | null | undefined
): string | undefined {
  if (!company) return undefined;
  return Array.isArray(company) ? company[0]?.name : company.name;
}

const MAX_MISSING_PER_COMPANY = 20;

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();

    const { data: invoices, error: invoicesError } = await supabase
      .from("Invoice")
      .select("invoiceNumber, companyId, status, company:Company(id, name)")
      .eq("userId", sessionUser.id)
      .not("status", "eq", "VOIDED")
      .order("invoiceNumber", { ascending: true });

    if (invoicesError) {
      console.error("Numbering check — зареждане на фактури:", invoicesError);
      return NextResponse.json(
        { error: "Грешка при зареждане на фактурите" },
        { status: 500 }
      );
    }

    if (!invoices?.length) {
      return NextResponse.json({ gaps: [], totalGaps: 0 });
    }

    const byCompany = new Map<string, { companyName: string; numbers: Set<number> }>();

    for (const inv of invoices) {
      const companyId = inv.companyId as string;
      const companyName = companyNameFromJoin(inv.company) ?? companyId;

      if (!byCompany.has(companyId)) {
        byCompany.set(companyId, { companyName, numbers: new Set() });
      }

      const numMatch = inv.invoiceNumber.match(/(\d+)$/);
      if (numMatch) {
        byCompany.get(companyId)!.numbers.add(parseInt(numMatch[1], 10));
      }
    }

    const gaps: Array<{
      companyId: string;
      companyName: string;
      missingNumbers: string[];
      lastNumber: string;
    }> = [];

    let totalGaps = 0;

    for (const [companyId, { companyName, numbers }] of byCompany) {
      const sorted = [...numbers].sort((a, b) => a - b);
      if (sorted.length < 2) continue;

      const missing: string[] = [];

      for (let i = 1; i < sorted.length; i++) {
        const expected = sorted[i - 1] + 1;
        if (sorted[i] > expected) {
          for (let n = expected; n < sorted[i] && missing.length < MAX_MISSING_PER_COMPANY; n++) {
            missing.push(String(n).padStart(10, "0"));
          }
        }
        if (missing.length >= MAX_MISSING_PER_COMPANY) break;
      }

      if (missing.length > 0) {
        gaps.push({
          companyId,
          companyName,
          missingNumbers: missing,
          lastNumber: String(sorted[sorted.length - 1]).padStart(10, "0"),
        });
        totalGaps += missing.length;
      }
    }

    return NextResponse.json({ gaps, totalGaps });
  } catch (error) {
    console.error("Numbering check error:", error);
    return NextResponse.json(
      { error: "Грешка при проверка на номерацията" },
      { status: 500 }
    );
  }
}
