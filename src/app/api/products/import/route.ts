import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { z } from "zod";
import cuid from "cuid";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

const rowSchema = z.object({
  name: z.string().min(2).max(FIELD_LIMITS.name),
  description: z.string().max(FIELD_LIMITS.description).optional().or(z.literal("")),
  price: z.number().min(0),
  unit: z.string().min(1).max(50).default("бр."),
  taxRate: z.number().min(0).max(100).default(20),
});

const MAX_ROWS = 500;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Сесията ви е невалидна." }, { status: 401 });
    }

    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const limitCheck = await checkSubscriptionLimits(sessionUser.id, "products");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Достигнат е лимитът за продукти." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rows: unknown[] = body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Няма редове за импортиране." }, { status: 400 });
    }
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Максимум ${MAX_ROWS} реда на импорт.` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const imported: { rowIndex: number; name: string; id: string }[] = [];
    const errors: { rowIndex: number; error: string }[] = [];
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const parsed = rowSchema.safeParse(rows[i]);
      if (!parsed.success) {
        errors.push({
          rowIndex: i + 1,
          error: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
        });
        continue;
      }

      const row = parsed.data;
      const productId = cuid();

      const { error: insertError } = await supabase.from("Product").insert({
        id: productId,
        name: row.name,
        description: row.description || null,
        price: row.price,
        unit: row.unit,
        taxRate: row.taxRate,
        isActive: true,
        userId: sessionUser.id,
        updatedAt: now,
      });

      if (insertError) {
        errors.push({ rowIndex: i + 1, error: insertError.message });
      } else {
        imported.push({ rowIndex: i + 1, name: row.name, id: productId });
      }
    }

    return NextResponse.json({
      imported: imported.length,
      failed: errors.length,
      results: imported,
      errors,
    });
  } catch (error) {
    console.error("Грешка при импорт на продукти:", error);
    return NextResponse.json(
      { error: "Неуспешен импорт. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
