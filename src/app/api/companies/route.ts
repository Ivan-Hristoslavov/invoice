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
import { getAccessibleCompaniesForUser } from "@/lib/team";
import { z } from "zod";
import cuid from "cuid";

// Define validation schema for company data
const companySchema = z.object({
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
  
  // Bulgarian-specific fields
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  accountablePerson: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  
  // Banking details
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
  bankSwift: z.string().optional().or(z.literal("")),
  bankIban: z.string().optional().or(z.literal("")),
});

function getDuplicateCompanyResponse(isOwnedByCurrentUser: boolean) {
  const message = isOwnedByCurrentUser
    ? "Вече сте добавили компания с този ЕИК/БУЛСТАТ."
    : "Тази компания вече е регистрирана в платформата и не може да бъде добавена към вашия акаунт.";

  return NextResponse.json(
    {
      error: message,
      details: [
        {
          path: ["bulstatNumber"],
          message,
        },
      ],
    },
    { status: 409 }
  );
}

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
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const supabase = createAdminClient();

    if (bulstatNumber) {
      const normalizedBulstat =
        normalizePartyInput({
          name: "Company duplicate check",
          bulstatNumber,
          uicType: uicType === "EGN" ? "EGN" : "BULSTAT",
        }).bulstatNumber || "";

      if (!normalizedBulstat || uicType === "EGN") {
        return NextResponse.json({
          exists: false,
          bulstatNumber: normalizedBulstat,
        });
      }

      const { data: company } = await supabase
        .from("Company")
        .select("id, userId")
        .eq("bulstatNumber", normalizedBulstat)
        .limit(1)
        .maybeSingle();

      if (!company) {
        return NextResponse.json({
          exists: false,
          bulstatNumber: normalizedBulstat,
        });
      }

      const isOwnedByCurrentUser = company.userId === sessionUser.id;
      const message = isOwnedByCurrentUser
        ? "Вече сте добавили компания с този ЕИК/БУЛСТАТ."
        : "Тази компания е регистрирана и не може да бъде добавена като ваша.";

      return NextResponse.json({
        exists: true,
        bulstatNumber: normalizedBulstat,
        isOwnedByCurrentUser,
        message,
      });
    }

    const accessibleCompanies = await getAccessibleCompaniesForUser(sessionUser.id);
    const accessibleCompanyIds = accessibleCompanies.map((company) => company.id);

    if (accessibleCompanyIds.length === 0) {
      return NextResponse.json(page > 0 ? { data: [], meta: { page, pageSize, totalItems: 0, totalPages: 0 } } : []);
    }

    let companyQuery = supabase
      .from("Company")
      .select("*", { count: "exact" })
      .in("id", accessibleCompanyIds);

    if (query) {
      companyQuery = companyQuery.or(
        `name.ilike.%${query}%,email.ilike.%${query}%,bulstatNumber.ilike.%${query}%`
      );
    }

    companyQuery = companyQuery.order("name", { ascending: true });

    if (page > 0) {
      const skip = (page - 1) * pageSize;
      companyQuery = companyQuery.range(skip, skip + pageSize - 1);
    }

    const { data: companies, count, error } = await companyQuery;

    if (error) {
      throw error;
    }

    if (page > 0) {
      return NextResponse.json({
        data: companies || [],
        meta: {
          page,
          pageSize,
          totalItems: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      });
    }

    return NextResponse.json(companies || []);
  } catch (error) {
    console.error("Грешка при извличане на компании:", error);
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

    const json = await request.json();
    
    // Validate incoming data
    const validatedData = companySchema.parse(json);
    const { normalized, issues } = validateBulgarianPartyInput(validatedData, {
      requireMol: true,
    });

    if (issues.length > 0) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: formatValidationIssues(issues) },
        { status: 400 }
      );
    }
    
    // Check subscription limits - брой фирми
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const companyLimitCheck = await checkSubscriptionLimits(
      sessionUser.id,
      'companies'
    );
    
    if (!companyLimitCheck.allowed) {
      return NextResponse.json(
        { error: companyLimitCheck.message || "Достигнат е лимитът за фирми за вашия план" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const bulstat = normalized.bulstatNumber || "";
    if (bulstat) {
      const { data: byBulstat } = await supabase
        .from("Company")
        .select("id, userId")
        .eq("bulstatNumber", bulstat)
        .limit(1)
        .maybeSingle();
      if (byBulstat) {
        return getDuplicateCompanyResponse(byBulstat.userId === sessionUser.id);
      }
    }
    const companyId = cuid();
    const payload = {
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
      registrationNumber: normalized.registrationNumber,
      bulstatNumber: bulstat || null,
      vatRegistered: normalized.vatRegistered ?? false,
      vatRegistrationNumber: normalized.vatRegistrationNumber || normalized.vatNumber || null,
      mol: normalized.mol,
      accountablePerson: normalized.accountablePerson,
      uicType: normalized.uicType ?? "BULSTAT",
      taxComplianceSystem:
        normalized.country?.toLowerCase() === "българия" ||
        normalized.country?.toLowerCase() === "bulgaria" ||
        bulstat
          ? "bulgarian"
          : "general",
      bankName: normalized.bankName,
      bankAccount: normalized.bankAccount,
      bankSwift: normalized.bankSwift,
      bankIban: normalized.bankIban,
    };

    const { data: company, error } = await supabase
      .from("Company")
      .insert({
        id: companyId,
        ...payload,
        userId: sessionUser.id,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return getDuplicateCompanyResponse(false);
      }
      throw error;
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Грешка при създаване на компания:", error);
    
    // Return validation errors if present
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Неуспешно създаване на компания" },
      { status: 500 }
    );
  }
}
