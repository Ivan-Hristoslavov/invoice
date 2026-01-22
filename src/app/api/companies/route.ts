import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import Stripe from 'stripe';
import { getStripeInstance } from '@/lib/stripe';
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    
    const { data: companies, error } = await supabase
      .from("Company")
      .select("*")
      .eq("userId", session.user.id)
      .order("name", { ascending: true });
    
    if (error) {
      throw error;
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Грешка при извличане на компании:", error);
    // Return empty array instead of error to allow graceful degradation
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

    const json = await request.json();
    
    // Validate incoming data
    const validatedData = companySchema.parse(json);
    
    // Check subscription limits - брой фирми
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const companyLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'companies'
    );
    
    if (!companyLimitCheck.allowed) {
      return NextResponse.json(
        { error: companyLimitCheck.message || "Достигнат е лимитът за фирми за вашия план" },
        { status: 403 }
      );
    }
    
    const supabase = createAdminClient();
    const companyId = cuid();
    
    const { data: company, error } = await supabase
      .from("Company")
      .insert({
        id: companyId,
        ...validatedData,
        userId: session.user.id,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
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

    // Find the user's company (assume one company per user for now)
    const supabase = createAdminClient();
    const { data: companies, error: findError } = await supabase
      .from("Company")
      .select("*")
      .eq("userId", session.user.id)
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