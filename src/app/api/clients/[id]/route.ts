import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import {
  formatValidationIssues,
  validateBulgarianPartyInput,
} from "@/lib/bulgarian-party";
import { getAccessibleOwnerUserIdsForUser } from "@/lib/team";
import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

const clientSchema = z.object({
  name: z.string().min(2, "Името на клиента е задължително").max(FIELD_LIMITS.name, "Името е твърде дълго"),
  email: z.string().email("Моля, въведете валиден имейл").max(FIELD_LIMITS.email).optional().or(z.literal("")),
  phone: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  address: z.string().max(FIELD_LIMITS.address).optional().or(z.literal("")),
  city: z.string().max(FIELD_LIMITS.city).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zipCode: z.string().max(FIELD_LIMITS.postalCode).optional().or(z.literal("")),
  country: z.string().max(FIELD_LIMITS.country).optional().or(z.literal("")),
  vatNumber: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  taxIdNumber: z.string().max(100).optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  mol: z.string().max(FIELD_LIMITS.mol).optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  locale: z.string().max(10).default("bg"),
  viesLastCheckAt: z.string().max(40).optional().nullable(),
  viesValid: z.boolean().optional().nullable(),
  viesCountryCode: z.string().max(2).optional().nullable(),
  viesNumberLocal: z.string().max(64).optional().nullable(),
  viesTraderName: z.string().max(2000).optional().nullable(),
  viesTraderAddress: z.string().max(4000).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Сесията ви е невалидна. Моля, влезте отново." }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = createAdminClient();
    const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);

    const { data: client, error } = await supabase
      .from("Client")
      .select("*")
      .eq("id", id)
      .in("userId", accessibleOwnerIds)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Грешка при извличане на клиент:", error);
    return NextResponse.json(
      { error: "Неуспешно извличане на клиент" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Сесията ви е невалидна. Моля, влезте отново." }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json();
    const validated = clientSchema.parse(json);
    const { normalized, issues } = validateBulgarianPartyInput(validated);

    if (issues.length > 0) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: formatValidationIssues(issues) },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);

    const { data: existingClient, error: existingClientError } = await supabase
      .from("Client")
      .select("id")
      .eq("id", id)
      .in("userId", accessibleOwnerIds)
      .single();

    if (existingClientError || !existingClient) {
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    const viesLastCheckAtRaw = validated.viesLastCheckAt?.trim();
    const viesLastCheckAt =
      viesLastCheckAtRaw && !Number.isNaN(Date.parse(viesLastCheckAtRaw))
        ? new Date(viesLastCheckAtRaw).toISOString()
        : null;

    const { data: client, error } = await supabase
      .from("Client")
      .update({
        name: normalized.name,
        email: normalized.email || null,
        phone: normalized.phone || null,
        address: normalized.address || null,
        city: normalized.city || null,
        state: normalized.state || null,
        zipCode: normalized.zipCode || null,
        country: normalized.country || null,
        vatNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
        taxIdNumber: normalized.taxIdNumber || null,
        bulstatNumber: normalized.bulstatNumber || null,
        vatRegistered: normalized.vatRegistered ?? false,
        vatRegistrationNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
        mol: normalized.mol || null,
        uicType: normalized.uicType ?? "BULSTAT",
        locale: normalized.locale || "bg",
        taxComplianceSystem:
          normalized.country?.toLowerCase() === "българия" ||
          normalized.country?.toLowerCase() === "bulgaria" ||
          normalized.bulstatNumber
            ? "bulgarian"
            : "general",
        updatedAt: new Date().toISOString(),
        viesLastCheckAt,
        viesValid: validated.viesValid ?? null,
        viesCountryCode: validated.viesCountryCode?.trim().toUpperCase() || null,
        viesNumberLocal: validated.viesNumberLocal?.trim() || null,
        viesTraderName: validated.viesTraderName?.trim() || null,
        viesTraderAddress: validated.viesTraderAddress?.trim() || null,
      })
      .eq("id", id)
      .in("userId", accessibleOwnerIds)
      .select()
      .single();

    if (error || !client) {
      throw error;
    }

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((e) => ({
        path: e.path.map(String),
        message: e.message,
      }));
      return NextResponse.json(
        { error: "Невалидни данни за клиента. Моля, проверете полетата.", details },
        { status: 400 }
      );
    }

    const maybeDbError = error as { code?: string; message?: string; details?: string } | null;
    if (
      maybeDbError?.code === "23505" &&
      (maybeDbError?.message?.includes("Client_userId_bulstat_active_key") ||
        maybeDbError?.details?.includes("bulstatNumber"))
    ) {
      return NextResponse.json(
        {
          error:
            "Вече имате активен клиент със същия ЕИК/БУЛСТАТ. Използвайте друг идентификатор или редактирайте съществуващия клиент.",
        },
        { status: 409 }
      );
    }

    console.error("Грешка при обновяване на клиент:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на клиент. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
