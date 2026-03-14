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

const companySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Името на компанията е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  accountablePerson: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
  bankSwift: z.string().optional().or(z.literal("")),
  bankIban: z.string().optional().or(z.literal("")),
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
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Грешка при обновяване на компания:", error);
    return NextResponse.json({ error: "Неуспешно обновяване на компания" }, { status: 500 });
  }
}
