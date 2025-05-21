import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStripeInstance } from '@/lib/stripe';
import { getCountryCode } from '@/lib/utils';

export async function POST(request: NextRequest) {
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
      // Convert country name to ISO code using the utility function
      const countryCode = getCountryCode(company.country);
      
      const account = await stripe.accounts.create({
        type: 'express',
        country: countryCode, // Use the ISO country code
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