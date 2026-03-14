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
import Stripe from 'stripe';
import { getStripeInstance } from '@/lib/stripe';
import cuid from "cuid";

// Define validation schema for company data
const companySchema = z.object({
  name: z.string().min(1, "Името на компанията е задължително1"),
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
    const query = searchParams.get("query") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "12")));

    const supabase = createAdminClient();

    let companyQuery = supabase
      .from("Company")
      .select("*", { count: "exact" })
      .eq("userId", sessionUser.id);

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
        .select("id")
        .ilike("bulstatNumber", bulstat)
        .limit(1)
        .maybeSingle();
      if (byBulstat) {
        return NextResponse.json(
          { error: "Фирма с този ЕИК/БУЛСТАТ вече е регистрирана в платформата. Един ЕИК може да бъде свързан само с един акаунт." },
          { status: 409 }
        );
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
        return NextResponse.json(
          { error: "Фирма с този ЕИК/БУЛСТАТ вече е регистрирана в платформата." },
          { status: 409 }
        );
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

// --- STRIPE CONNECT ONBOARDING ENDPOINT ---
export async function POST_STRIPE_CONNECT_ONBOARDING(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Find the user's company (assume one company per user for now)
    const supabase = createAdminClient();
    const { data: companies, error: findError } = await supabase
      .from("Company")
      .select("*")
      .eq("userId", sessionUser.id)
      .limit(1);
    
    const company = companies?.[0];
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const stripe = await getStripeInstance();
    let stripeAccountId = company.stripeAccountId;

    // If no Stripe account, create one
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: company.country || 'BG',
        email: company.email || undefined,
        business_type: 'company',
        business_profile: {
          name: company.name,
          product_description: 'Invoice payments via RapidFrame',
        },
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });
      stripeAccountId = account.id;
      await supabase
        .from("Company")
        .update({ stripeAccountId, updatedAt: new Date().toISOString() })
        .eq("id", company.id);
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/company?stripe=refresh',
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/company?stripe=success',
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 });
  }
} 