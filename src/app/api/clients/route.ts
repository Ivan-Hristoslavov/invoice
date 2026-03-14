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

// Define validation schema for client
const clientSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  
  // Bulgarian-specific fields
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  
  locale: z.string().default("bg"),
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
    const query = searchParams.get("query") || "";
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
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Грешка при създаване на клиент:", error);
    
    // Return validation errors if present
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Неуспешно създаване на клиент" },
      { status: 500 }
    );
  }
} 