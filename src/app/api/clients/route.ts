import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import {
  formatValidationIssues,
  normalizePartyInput,
  validateBulgarianPartyInput,
} from "@/lib/bulgarian-party";
import { getAccessibleOwnerUserIdsForUser } from "@/lib/team";
import { z } from "zod";
import cuid from "cuid";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

// Define validation schema for client
const clientSchema = z.object({
  name: z.string().min(2, "Името на клиента е задължително (минимум 2 символа)").max(FIELD_LIMITS.name, "Името е твърде дълго"),
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const bulstatNumber = searchParams.get("bulstatNumber");
    const uicType = searchParams.get("uicType");
    const rawQuery = searchParams.get("query") || "";
    const query = rawQuery.slice(0, FIELD_LIMITS.searchQuery).trim().replace(/[%_]/g, " ");
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const supabase = createAdminClient();
    const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);

    if (bulstatNumber) {
      const normalizedBulstat =
        normalizePartyInput({
          name: "Client duplicate check",
          bulstatNumber,
          uicType: uicType === "EGN" ? "EGN" : "BULSTAT",
        }).bulstatNumber || "";

      if (!normalizedBulstat) {
        return NextResponse.json({
          exists: false,
          bulstatNumber: normalizedBulstat,
        });
      }

      const { data: client } = await supabase
        .from("Client")
        .select("id")
        .in("userId", accessibleOwnerIds)
        .eq("bulstatNumber", normalizedBulstat)
        .limit(1)
        .maybeSingle();

      return NextResponse.json({
        exists: Boolean(client),
        bulstatNumber: normalizedBulstat,
        message: client ? "Вече имате клиент с този ЕИК/БУЛСТАТ." : null,
      });
    }

    let clientQuery = supabase
      .from("Client")
      .select("*", { count: "exact" })
      .in("userId", accessibleOwnerIds);

    // Server-side search via ilike (faster than JS filtering)
    if (query) {
      clientQuery = clientQuery.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,city.ilike.%${query}%,country.ilike.%${query}%`
      );
    }

    clientQuery = clientQuery.order("name", { ascending: true });

    // Apply pagination only when page param is provided
    if (page > 0) {
      const skip = (page - 1) * pageSize;
      clientQuery = clientQuery.range(skip, skip + pageSize - 1);
    }

    const { data: clients, count, error } = await clientQuery;

    if (error) {
      throw error;
    }

    // Return paginated response when page was requested
    if (page > 0) {
      return NextResponse.json({
        data: clients || [],
        meta: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      });
    }

    return NextResponse.json(clients || []);
  } catch (error) {
    console.error("Грешка при извличане на клиенти:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json(
        { error: "Сесията ви е невалидна. Моля, влезте отново." },
        { status: 401 }
      );
    }

    // Check subscription limits - брой клиенти
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const clientLimitCheck = await checkSubscriptionLimits(
      sessionUser.id,
      'clients'
    );
    
    if (!clientLimitCheck.allowed) {
      return NextResponse.json(
        { error: clientLimitCheck.message || "Достигнат е лимитът за клиенти за вашия план" },
        { status: 403 }
      );
    }

    // Parse and validate the data
    const json = await request.json();
    const entryMode = json?.entryMode === "manual" ? "manual" : "eik";
    const validatedData = clientSchema.parse(json);
    const viesLastCheckAtRaw = validatedData.viesLastCheckAt?.trim();
    const viesLastCheckAt =
      viesLastCheckAtRaw && !Number.isNaN(Date.parse(viesLastCheckAtRaw))
        ? new Date(viesLastCheckAtRaw).toISOString()
        : null;
    const { normalized, issues } = validateBulgarianPartyInput(validatedData, {
      skipIdentifierFormatValidation: entryMode === "manual",
    });

    if (issues.length > 0) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: formatValidationIssues(issues) },
        { status: 400 }
      );
    }
    
    const supabase = createAdminClient();

    // Prevent duplicate clients with the same normalized identifier (EIK/BULSTAT)
    const accessibleOwnerIds = await getAccessibleOwnerUserIdsForUser(sessionUser.id);
    const normalizedBulstat = normalized.bulstatNumber || "";

    if (normalizedBulstat) {
      const { data: existingClient, error: duplicateCheckError } = await supabase
        .from("Client")
        .select("id")
        .in("userId", accessibleOwnerIds)
        .eq("bulstatNumber", normalizedBulstat)
        .limit(1)
        .maybeSingle();

      if (duplicateCheckError) {
        console.error("Грешка при проверка за дублиран клиент:", duplicateCheckError);
      }

      if (existingClient) {
        return NextResponse.json(
          {
            error: "Вече имате клиент с този ЕИК/БУЛСТАТ.",
            details: [
              {
                path: ["bulstatNumber"],
                message: "Вече имате клиент с този ЕИК/БУЛСТАТ.",
              },
            ],
          },
          { status: 409 },
        );
      }
    }

    // Create the client
    const clientId = cuid();
    const { data: client, error } = await supabase
      .from("Client")
      .insert({
        id: clientId,
        name: normalized.name,
        email: normalized.email,
        phone: normalized.phone,
        address: normalized.address,
        city: normalized.city,
        state: normalized.state,
        zipCode: normalized.zipCode,
        country: normalized.country,
        vatNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
        taxIdNumber: normalized.taxIdNumber,
        bulstatNumber: normalized.bulstatNumber,
        vatRegistered: normalized.vatRegistered ?? false,
        vatRegistrationNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
        mol: normalized.mol,
        uicType: normalized.uicType ?? "BULSTAT",
        locale: normalized.locale || "bg",
        taxComplianceSystem:
          normalized.country?.toLowerCase() === "българия" ||
          normalized.country?.toLowerCase() === "bulgaria" ||
          normalized.bulstatNumber
            ? "bulgarian"
            : "general",
        userId: sessionUser.id,
        createdById: sessionUser.id,
        updatedAt: new Date().toISOString(),
        viesLastCheckAt,
        viesValid: validatedData.viesValid ?? null,
        viesCountryCode: validatedData.viesCountryCode?.trim().toUpperCase() || null,
        viesNumberLocal: validatedData.viesNumberLocal?.trim() || null,
        viesTraderName: validatedData.viesTraderName?.trim() || null,
        viesTraderAddress: validatedData.viesTraderAddress?.trim() || null,
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Грешка при създаване на клиент:", error);
    
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

    return NextResponse.json(
      { error: "Неуспешно създаване на клиент. Моля, опитайте отново." },
      { status: 500 }
    );
  }
} 