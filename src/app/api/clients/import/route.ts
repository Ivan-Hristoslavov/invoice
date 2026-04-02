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
  email: z.string().email().max(FIELD_LIMITS.email).optional().or(z.literal("")),
  phone: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  mol: z.string().max(FIELD_LIMITS.mol).optional().or(z.literal("")),
  address: z.string().max(FIELD_LIMITS.address).optional().or(z.literal("")),
  city: z.string().max(FIELD_LIMITS.city).optional().or(z.literal("")),
  zipCode: z.string().max(FIELD_LIMITS.postalCode).optional().or(z.literal("")),
  country: z.string().max(FIELD_LIMITS.country).optional().or(z.literal("")),
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
    const limitCheck = await checkSubscriptionLimits(sessionUser.id, "clients");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Достигнат е лимитът за клиенти." },
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

    const { data: existingClients } = await supabase
      .from("Client")
      .select("bulstatNumber")
      .eq("userId", sessionUser.id)
      .not("bulstatNumber", "is", null);

    const existingEiks = new Set(
      (existingClients || [])
        .map((c) => c.bulstatNumber?.trim())
        .filter(Boolean)
    );

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
      const eik = row.bulstatNumber?.trim() || "";

      if (eik && existingEiks.has(eik)) {
        errors.push({
          rowIndex: i + 1,
          error: `ЕИК ${eik} вече съществува — пропуснат.`,
        });
        continue;
      }

      const clientId = cuid();
      const { error: insertError } = await supabase.from("Client").insert({
        id: clientId,
        name: row.name,
        email: row.email || null,
        phone: row.phone || null,
        bulstatNumber: eik || null,
        vatRegistered: row.vatRegistered ?? false,
        vatRegistrationNumber: row.vatRegistrationNumber || null,
        vatNumber: row.vatRegistrationNumber || null,
        mol: row.mol || null,
        address: row.address || null,
        city: row.city || null,
        zipCode: row.zipCode || null,
        country: row.country || null,
        uicType: "BULSTAT",
        locale: "bg",
        taxComplianceSystem: eik ? "bulgarian" : "general",
        userId: sessionUser.id,
        createdById: sessionUser.id,
        updatedAt: now,
      });

      if (insertError) {
        errors.push({ rowIndex: i + 1, error: insertError.message });
      } else {
        imported.push({ rowIndex: i + 1, name: row.name, id: clientId });
        if (eik) existingEiks.add(eik);
      }
    }

    return NextResponse.json({
      imported: imported.length,
      failed: errors.length,
      results: imported,
      errors,
    });
  } catch (error) {
    console.error("Грешка при импорт на клиенти:", error);
    return NextResponse.json(
      { error: "Неуспешен импорт. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
