import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import Stripe from 'stripe';
import { getStripeInstance } from '@/lib/stripe';

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
  mол: z.string().optional().or(z.literal("")),
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

    const companies = await prisma.company.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Грешка при извличане на компании:", error);
    return NextResponse.json(
      { error: "Неуспешно извличане на компании" },
      { status: 500 }
    );
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
    
    const company = await prisma.company.create({
      data: {
        ...validatedData,
        userId: session.user.id
      }
    });

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
    const company = await prisma.company.findFirst({
      where: { userId: session.user.id },
    });
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
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeAccountId },
      });
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