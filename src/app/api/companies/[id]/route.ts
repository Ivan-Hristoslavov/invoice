import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import {
  formatValidationIssues,
  validateBulgarianPartyInput,
} from "@/lib/bulgarian-party";
import { z } from "zod";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Името на компанията е задължително").max(FIELD_LIMITS.name, "Името е твърде дълго"),
  email: z.string().email("Моля, въведете валиден имейл").max(FIELD_LIMITS.email).optional().or(z.literal("")),
  phone: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  address: z.string().max(FIELD_LIMITS.address).optional().or(z.literal("")),
  city: z.string().max(FIELD_LIMITS.city).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  zipCode: z.string().max(FIELD_LIMITS.postalCode).optional().or(z.literal("")),
  country: z.string().max(FIELD_LIMITS.country).optional().or(z.literal("")),
  vatNumber: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  taxIdNumber: z.string().max(100).optional().or(z.literal("")),
  registrationNumber: z.string().max(100).optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().max(FIELD_LIMITS.phone).optional().or(z.literal("")),
  mol: z.string().max(FIELD_LIMITS.mol).optional().or(z.literal("")),
  accountablePerson: z.string().max(FIELD_LIMITS.accountablePerson).optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  bankName: z.string().max(FIELD_LIMITS.bankName).optional().or(z.literal("")),
  bankAccount: z.string().max(FIELD_LIMITS.bankAccount).optional().or(z.literal("")),
  bankSwift: z.string().max(FIELD_LIMITS.bankSwift).optional().or(z.literal("")),
  bankIban: z.string().max(FIELD_LIMITS.bankIban).optional().or(z.literal("")),
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
    const { data: company, error } = await supabase
      .from("Company")
      .select("*")
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();
    if (error || !company) {
      return NextResponse.json({ error: "Компанията не е намерена" }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error) {
    console.error("Грешка при извличане на компания:", error);
    return NextResponse.json({ error: "Неуспешно извличане на компания" }, { status: 500 });
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

    const { id: companyId } = await context.params;
    const json = await request.json();
    const validated = companySchema.parse(json);
    const { normalized, issues } = validateBulgarianPartyInput(validated, {
      requireMol: true,
    });

    if (issues.length > 0) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: formatValidationIssues(issues) },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: existing, error: fetchError } = await supabase
      .from("Company")
      .select("id, bulstatNumber")
      .eq("id", companyId)
      .eq("userId", sessionUser.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Компанията не е намерена" }, { status: 404 });
    }

    const bulstat = normalized.bulstatNumber || "";
    if (bulstat) {
      const { data: other } = await supabase
        .from("Company")
        .select("id")
        .ilike("bulstatNumber", bulstat)
        .neq("id", companyId)
        .limit(1)
        .maybeSingle();
      if (other) {
        return NextResponse.json(
          { error: "Фирма с този ЕИК/БУЛСТАТ вече е регистрирана в платформата. Един ЕИК може да бъде свързан само с един акаунт." },
          { status: 409 }
        );
      }
    }

    const updatePayload: Record<string, unknown> = {
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
      registrationNumber: normalized.registrationNumber || null,
      bulstatNumber: bulstat || null,
      vatRegistered: normalized.vatRegistered ?? false,
      vatRegistrationNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
      mol: normalized.mol || null,
      accountablePerson: normalized.accountablePerson || null,
      uicType: normalized.uicType ?? "BULSTAT",
      taxComplianceSystem:
        normalized.country?.toLowerCase() === "българия" ||
        normalized.country?.toLowerCase() === "bulgaria" ||
        bulstat
          ? "bulgarian"
          : "general",
      bankName: normalized.bankName || null,
      bankAccount: normalized.bankAccount || null,
      bankSwift: normalized.bankSwift || null,
      bankIban: normalized.bankIban || null,
      updatedAt: new Date().toISOString(),
    };

    const { data: company, error: updateError } = await supabase
      .from("Company")
      .update(updatePayload)
      .eq("id", companyId)
      .eq("userId", sessionUser.id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return NextResponse.json(
          { error: "Фирма с този ЕИК/БУЛСТАТ вече е регистрирана в платформата." },
          { status: 409 }
        );
      }
      throw updateError;
    }

    return NextResponse.json(company);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map((e) => ({
        path: e.path.map(String),
        message: e.message,
      }));
      return NextResponse.json(
        { error: "Невалидни данни за компанията. Моля, проверете полетата.", details },
        { status: 400 }
      );
    }
    console.error("Грешка при обновяване на компания:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на компания. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
